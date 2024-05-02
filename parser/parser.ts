import {type TextTree, type Config, type FlatContainer, type Container} from "./types.js";
import config from "../config.json" assert {type:"json"};

export class Parser {

    private sourceTree: TextTree;
    private titleNodes: TextTree[];
    private containers: Container[];
    private flatContainers: FlatContainer[];

    constructor(sourceTree: TextTree) {
        this.sourceTree = sourceTree;
        this.titleNodes = [];
        this.containers = [];
        this.flatContainers = [];
        this.validate();
    }

    validate(): void {

        if (typeof this.sourceTree !== 'object')
            throw Error("No JSON Render provided to Parser");

        if (this.sourceTree.styles === undefined)
            throw Error("Malformed JSON Render provided");
    }

    /**
     * First stage of parsing. Modify the TextTree with cascaded css and parent references
     * for faster and more convenient lookups whilst parsing
     */
    preprocess(): TextTree {
        this.setRefToParent(this.sourceTree);
        this.cascade(this.sourceTree, null);
        return this.sourceTree;
    }

    /**
     * Second stage of parsing. Create a list of nodes that represent content titles
     */
    titles(): TextTree[] {
        this.collectTitles(this.sourceTree);
        if (this.titleNodes.length === 0)
            throw Error("No titles found");
        this.titleNodes.sort(this.sortTitles);
        return this.titleNodes;
    }

    /**
     * Third stage of parsing. Containers are parsed and flattened into lists
     */
    lists(): FlatContainer[] {

        this.containerize(this.titleNodes);
        this.flattenContainers(this.containers);
        return this.flatContainers;
    }

    parse(): FlatContainer[] {
        this.preprocess();
        this.titles();
        return this.lists();
    }

    private setRefToParent(tree: TextTree) {

        if (tree.children === undefined)
            return;

        for (const child of tree.children) {
            child.parent = tree;

            this.setRefToParent(child);
        }
    }

    //The block elements 'send' down their stylings to any text elements below
    //this is so that we can access those stylings without traversal
    private cascade(tree: TextTree, blockParent: TextTree | null) {

        if (tree.children === undefined)
            return;

        for (const child of tree.children) {

            if (child === undefined)
                continue;

            /*
             * Propagate the last block parent so that styles cascade down
             */
            if (child.type === 'block') {

                blockParent = child;

            } else if (child.type === 'text' && blockParent && blockParent.styles) {

                child.styles = blockParent.styles;

                //Bigger and Bolder text has higher score
                child.styles.titleScore = child.styles.size +
                    ((child.styles.weight/100) - (config.TITLE_ELIGIBILITY_SCORE_WEIGHT_CONTRIBUTION_THRESHOLD/100))

                //Punish one word titles
                if (child.text!.trim().indexOf(" ") == -1)
                    child.styles.titleScore -= 1;

                //Titles further left have higher scores
                if (child.styles.left)
                    child.styles.titleScore += (((this.sourceTree.styles!.width - child.styles.left) / this.sourceTree.styles!.width) * config.TITLE_SCORE_LEFT_WEIGHT)
            }

            /*
             * Propagate special tags to all children
             */
            if (child.parent) {
                if (child.parent.specialParent)
                    child.specialParent = child.parent.specialParent;
                else if (child.parent.tag !== undefined && config.SPECIAL_PARENTS.includes(child.parent.tag))
                    child.specialParent = child.parent.tag;
            }

            //Recurse
            if (child.children)
                this.cascade(child, blockParent);
        }
    }


    private collectTitles(tree: TextTree) {

        if (tree.children === undefined)
            return;

        //Wildcard match tag name, to ignore screen reader content etc
        if (tree.tag ) {
        }

        for (const child of tree.children) {

            if (child === undefined)
                continue;

            if (child.type === 'text' && child.text !== undefined && child.styles !== undefined &&
                (child.styles.size > config.TITLE_THRESHOLD_FONT_SIZE
                    || child.styles.weight > config.TITLE_THRESHOLD_FONT_WEIGHT)) {

                let c = config.DONT_USE_AS_TITLE_STARTS_WITH;

                if(!config.DONT_USE_AS_TITLE.includes(child.text.toLowerCase()) &&
                    !c.find((text:string) => {return c.includes(child.text[0])}) &&
                    !this.isNumber(child.text)
                  )
                    this.titleNodes.push(child);
            }

            if (child.children)
                this.collectTitles(child);
        }
    }

    private isNumber = (value:string) => /^\d+$/.test(value);

    /**
     * Sorts our list of titles by font size descending
     * this is so that the larger the title the higher priority it has
     */
    private sortTitles(a:TextTree, b:TextTree) {
        if (a.styles === undefined || b.styles === undefined) {
            throw Error("TextTree not cascaded in sort titles");
        }

        //sorts on styles.size DESC
        return (b.styles.titleScore > a.styles.titleScore) ? 1 : ((a.styles.titleScore > b.styles.titleScore) ? -1 : 0);
    }

    private containerize(titleNodes: TextTree[]) {

        for (const child of titleNodes) {

            if (child === undefined)
                continue;

            const container = this.findParentContainer(child);
            if (container)
                this.containers.push({title: child, container: container});
        }
    }

    /*
     * Recursively backtrack/ascend looking for the "end" of the container
     */
    private findParentContainer(tree: TextTree): TextTree | undefined {

        if (tree.parent === undefined)
            return undefined;

        //They made it easy on us and used <li> or some such
        if (tree.tag && config.SPECIAL_PARENTS.includes(tree.tag))
            return this.markAndReturnContainer(tree);

        if (!tree.specialParent && tree.parent.styles !== undefined) {

            //Borders usually mean a container
            if (tree.parent.styles.border > 0) //|| tree.parent.styles.borderRadius > 0)
                return this.markAndReturnContainer(tree.parent);

            /*
            * If the container is greater than CONTAINER_MIN_PX_WIDTH_CHANGE_CONTAINER
            * then we can check if the parent grows WIDTH_CHANGE_CONTAINER_THRESHOLD x larger
            *
            * This helps match when there are no borders or useful tags to signify the end of a container
            */
            if (tree.styles !== undefined &&
                tree.styles.width > config.CONTAINER_MIN_PX_WIDTH_CHANGE_CONTAINER &&
                tree.parent.styles.width > (tree.styles.width * config.WIDTH_CHANGE_CONTAINER_THRESHOLD)) {
                return this.markAndReturnContainer(tree);
            }

        }

        return this.findParentContainer(tree.parent);
    }

    private markAndReturnContainer(tree: TextTree): TextTree | undefined {

        if (tree.containerized) //Dont containerize the same thing twice
            return undefined;

        tree.containerized = true;
        return tree;
    }

    private flattenContainers(containers: Container[]) {

        for (const {title, container} of containers) {

            if (!title.text)
                continue;

            let content = { text: "" }; //So we can pass by ref
            this.rollup(container, content);

            let thisContainer: FlatContainer = {
                title: title.text.trim(),
                content: content.text.trim(),
            }

            if(config.IGNORE_CONTAINER_TITLES.includes(title.text.toLowerCase()))
                continue;
            //if its not empty
            if (title.text.replaceAll(" ", "") !== content.text.replaceAll(" ", ""))
            this.flatContainers.push(thisContainer);
        }
    }

    private rollup(container: TextTree, content: {text: string}) {

        if (container.children === undefined)
            return;
        for (const child of container.children) {

            if (child === undefined)
                continue;

            if (child.text)
                content.text += child.text + " ";


            this.rollup(child, content);
        }
    }


    /*
    * Exposure for testing purposes only
    */
    getContainers(): Container[] {
        return this.containers
    }

}
