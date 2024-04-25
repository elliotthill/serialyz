type TextTree = {
    type: "block" | "text" | undefined;
    tag: string | undefined;
    text: string | undefined;
    styles: TextTreeStyles | undefined;
    debug: Node | undefined;
    children: TextTree[];
    parent: TextTree | undefined;
    containerized: boolean | undefined;
};

type TextTreeStyles = {
    border: number,
    weight: number,
    size: number
}




export const extract = async() => {

    const TITLE_THRESHOLD_FONT_SIZE = 16;
    const TITLE_THRESHOLD_FONT_WEIGHT = 400;
    const tagBlacklist = ["HEADER", "BUTTON", "SCRIPT", "FORM", "INPUT", "FOOTER"];

    let textTree: TextTree = {};

    const walk = (node: Node, func: (node: Node, textTree:TextTree) => void, textTree: TextTree) => {

        if (node.nodeType === Node.ELEMENT_NODE && tagBlacklist.includes(node.tagName))
            return;

        const children = node.childNodes;
        func(node, textTree);
        textTree.children = [];

        for (var i = 0; i < children.length; i++) { // Children are siblings to each other
            textTree.children[i] = {parent:textTree};
            walk(children[i], func, textTree.children[i]);
        }
    }

    const isEmpty = (str:string) => !str.replace(/\s/g, '').length

    const getStyle = (node: Node, style:string):string => {

        return getComputedStyle(node).getPropertyValue(style).replace("px","");
    }

    const getStylePx = (node: Node, style:string):number => {

        return parseInt(getStyle(node, style)) || 0;
    }

    const nodeProc = (node: Node, appendTo: TextTree) => {

        if (node.nodeType === Node.ELEMENT_NODE) {
            appendTo.debug = node;
            appendTo.type = "block";
            appendTo.tag = node.tagName;

            let combinedBorder = getStylePx(node, "border-bottom-width") +
                getStylePx(node, "border-top-width") + getStylePx(node, "border-left-width") +
                getStylePx(node, "border-right-width");

            appendTo.styles = {
                border: combinedBorder,
                weight: getStylePx(node, "font-weight"),
                size: getStylePx(node, "font-size"),
            };
        }

        if (node.nodeType === Node.TEXT_NODE && !isEmpty(node.textContent)) {
            appendTo.text = node.textContent;
            appendTo.debug = node;
            appendTo.type = "text";
        }
    }



    //Applies Styles onto every child element.
    //So every text element will have a font size now.
    const cascade = (tree: TextTree, parent: TextTree | null) => {

        for (const child of tree.children) {

            if (child === undefined)
                continue;

            if (child.type === 'block') {
                parent = child;
            } else if (child.type === 'text') {
                if (parent) {
                    child.styles = parent.styles;
                }
            }
            if (child.children)
            cascade(child, parent);
        }
    }

    let titles:TextTree[] = [];
    const titleIfy = (tree: TextTree) => {

        for (const child of tree.children) {

            if (child === undefined)
                continue;

            if (child.type === 'text' && child.styles !== undefined &&
                (child.styles.size > TITLE_THRESHOLD_FONT_SIZE
                    || child.styles.weight > TITLE_THRESHOLD_FONT_WEIGHT)) {

                titles.push(child);
            }

            if (child.children)
                titleIfy(child);
        }
    }


    let containers: Container[] = [];
    type Container = {
        title: TextTree;
        container: TextTree;
    }

    let flatContainers: FlatContainer[] = [];
    type FlatContainer = {
        title: string;
        content: string;
    }

    const containerize = (titles: TextTree[]) => {

        const findParentContainer = (tree: TextTree): TextTree | undefined => {

            if (tree.parent === undefined)
                return undefined;

            if (tree.parent.styles !== undefined && tree.parent.styles.border > 0) {

                //First come first serve for containers
                if (tree.parent.containerized)
                    return undefined;
                tree.parent.containerized = true;
                return tree.parent;
            }

            return findParentContainer(tree.parent);
        }

        const containerRollupText = (container: TextTree, content: {text: string}) => {

            if (container.children === undefined)
                return;
            for (const child of container.children) {

                if (child === undefined)
                    continue;

                if (child.text)
                    content.text += child.text + " ";


                containerRollupText(child, content);
            }

        }

        for (const child of titles) {

            if (child === undefined)
                continue;

            const container = findParentContainer(child);
            if (container)
                containers.push({title:child, container: container});
        }

        for (const {title,container} of containers) {

            if (!title.text)
                continue;

            let content = {text:""}; //So we can pass by ref
            containerRollupText(container, content);

            let thisContainer: FlatContainer = {
                title: title.text,
                content:content.text,
            }

            flatContainers.push(thisContainer);
        }

    }


    walk(document.body, nodeProc, textTree); //Prints out every node

    cascade(textTree, null);
    titleIfy(textTree);
    console.log(`${titles.length} titles found `);
    containerize(titles);
    console.log(`${containers.length} containers found `);
    console.log(`${flatContainers.length} flat containers produced`);
    const debug = {flatContainers};
    //console.log(JSON.stringify(debug));
    console.log(flatContainers);
    return Promise.resolve(debug);
}
