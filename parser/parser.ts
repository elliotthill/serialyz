import { type TextTree, type Config, type FlatContainer, type Container, type ImagesWidths } from "./types.js"
import config from "./config.json" assert {type: "json"}
import { scanTextForCountryLocation, scanTextForUSLocation } from "./location/location_matching.js"

export class Parser {
    private readonly sourceTree: TextTree
    private readonly titleNodes: TextTree[]
    private readonly containers: Container[]
    private readonly flatContainers: FlatContainer[]

    constructor(sourceTree: TextTree) {
        this.sourceTree = sourceTree
        this.titleNodes = []
        this.containers = []
        this.flatContainers = []
        this.validate()
    }
    /**
     * Validate input sourceTree
     */
    validate(): void {
        if (typeof this.sourceTree !== "object") throw Error("No JSON Render provided to Parser")

        if (this.sourceTree.styles === undefined) throw Error("Malformed JSON Render provided")
    }
    /**
     * First stage of parsing. Modify the TextTree with cascaded css and parent references
     * for faster and more convenient lookups whilst parsing
     */
    preprocess(): TextTree {
        this.setRefToParent(this.sourceTree)
        this.cascade(this.sourceTree, null)
        return this.sourceTree
    }

    /**
     * Second stage of parsing. Create a list of nodes that represent content titles
     */
    titles(): TextTree[] {
        this.collectTitles(this.sourceTree)
        if (this.titleNodes.length === 0) throw Error("No titles found")
        this.titleNodes.sort(this.sortTitles)
        return this.titleNodes
    }

    /**
     * Third stage of parsing. Containers are parsed and flattened into lists
     */
    lists(): FlatContainer[] {
        this.containerize(this.titleNodes)
        this.linkerize(this.containers)
        this.imageize(this.containers)
        this.flattenContainers(this.containers)
        this.removeFluffContainers(this.flatContainers)
        return this.flatContainers
    }

    /**
     * All parsing stages.
     */
    parse(): FlatContainer[] {
        this.preprocess()
        this.titles()
        return this.lists()
    }

    /// Give each node a reference to its parent
    private setRefToParent(tree: TextTree) {
        if (tree.children === undefined) return

        for (const child of tree.children) {
            child.parent = tree

            this.setRefToParent(child)
        }
    }

    //The block elements 'send' down their stylings to any text elements below
    //this is so that we can access those stylings without traversal
    private cascade(tree: TextTree, blockParent: TextTree | null) {
        if (tree.children === undefined) return

        for (const child of tree.children) {
            if (child === undefined) continue

            /*
             * Propagate the last block parent so that styles cascade down
             */
            if (child.type === "block") {
                blockParent = child
            } else if (child.type === "text" && blockParent && blockParent.styles) {
                child.styles = blockParent.styles

                //Bigger and Bolder text has higher score
                child.styles.titleScore =
                    child.styles.size +
                    (child.styles.weight / 100 - config.TITLE_ELIGIBILITY_SCORE_WEIGHT_CONTRIBUTION_THRESHOLD / 100)

                //Punish one word titles
                if (child.text!.trim().indexOf(" ") == -1) child.styles.titleScore -= 1

                //Titles further left have higher scores
                if (child.styles.left)
                    child.styles.titleScore +=
                        ((this.sourceTree.styles!.width - child.styles.left) / this.sourceTree.styles!.width) *
                        config.TITLE_SCORE_LEFT_WEIGHT

                //Higher titles have higher scores
                //For each 50 pixels down, we deduct one point from its score.
                if (child.styles.top) child.styles.titleScore -= child.styles.top / 50
            }

            /*
             * Propagate special tags to all children
             */
            if (child.parent) {
                if (child.parent.specialParent) child.specialParent = child.parent.specialParent
                else if (child.parent.tag !== undefined && config.SPECIAL_PARENTS.includes(child.parent.tag))
                    child.specialParent = child.parent.tag
            }

            /*
             * Propogate links to all children
             */
            if (child.parent && child.parent.link !== undefined) {
                child.link = child.parent.link
            }

            //Recurse
            if (child.children) this.cascade(child, blockParent)
        }
    }

    /**
     * Parse titles  from the page
     */
    private collectTitles(tree: TextTree) {
        if (tree.children === undefined) return

        //Wildcard match tag name, to ignore screen reader content etc
        if (tree.tag) {
        }

        for (const child of tree.children) {
            if (child === undefined) continue

            if (
                child.type === "text" &&
                child.text !== undefined &&
                child.styles !== undefined &&
                (child.styles.size > config.TITLE_THRESHOLD_FONT_SIZE ||
                    child.styles.weight > config.TITLE_THRESHOLD_FONT_WEIGHT)
            ) {
                let c = config.DONT_USE_AS_TITLE_STARTS_WITH

                if (
                    !config.DONT_USE_AS_TITLE.includes(child.text.toLowerCase().trim()) &&
                    !c.find((text: string) => {
                        return c.includes(child.text![0])
                    }) &&
                    !this.isNumber(child.text)
                )
                    this.titleNodes.push(child)
            }

            if (child.children) this.collectTitles(child)
        }
    }

    private isNumber = (value: string) => /^\d+$/.test(value)

    /**
     * Sorts our list of titles by font size descending
     * this is so that the larger the title the higher priority it has
     */
    private sortTitles(a: TextTree, b: TextTree) {
        if (a.styles === undefined || b.styles === undefined) {
            throw Error("TextTree not cascaded in sort titles")
        }

        //sorts on styles.size DESC
        return b.styles.titleScore > a.styles.titleScore ? 1 : a.styles.titleScore > b.styles.titleScore ? -1 : 0
    }

    /*
     * Each title should be assigned a node container it is the title of
     */
    private containerize(titleNodes: TextTree[]) {
        //First pass
        for (const child of titleNodes) {
            if (child === undefined) continue

            const container = this.findParentContainer(child)
            if (container) this.containers.push({ title: child, container: container })
        }

        //If we found nothing, make a second pass with much more permissive container matching
        if (this.containers.length > 0) return

        for (const child of titleNodes) {
            if (child === undefined) continue

            const container = this.findParentContainerEager(child)
            if (container) this.containers.push({ title: child, container: container })
        }
    }

    /*
     * Recursively backtrack/ascend looking for the "end" of the container
     */
    private findParentContainer(tree: TextTree): TextTree | undefined {
        if (tree.parent === undefined) return undefined

        //They made it easy on us and used <li> or some such
        if (tree.tag && config.SPECIAL_PARENTS.includes(tree.tag)) return this.markAndReturnContainer(tree)

        if (!tree.specialParent && tree.parent.styles !== undefined) {
            //If it suddenly expands 10x taller, dont allow to expand
            if (
                tree.styles &&
                tree.parent.styles.height &&
                tree.styles.height &&
                tree.styles.height * 100 < tree.parent.styles.height
            ) {
                return this.markAndReturnContainer(tree)
            }

            //Borders usually mean a container
            if (tree.parent.styles.border > 0) {
                return this.markAndReturnContainer(tree.parent)
            }
            //Box shadow AND a border radius usually means a container
            if (tree.parent.styles.boxShadow && tree.parent.styles.borderRadius > 0) {
                return this.markAndReturnContainer(tree.parent)
            }
            /*
             * If the container is greater than CONTAINER_MIN_PX_WIDTH_CHANGE_CONTAINER
             * then we can check if the parent grows WIDTH_CHANGE_CONTAINER_THRESHOLD x larger
             *
             * This helps match when there are no borders or useful tags to signify the end of a container
             */
            if (
                tree.styles !== undefined &&
                tree.styles.width > config.CONTAINER_MIN_PX_WIDTH_CHANGE_CONTAINER &&
                tree.parent.styles.width > tree.styles.width * config.WIDTH_CHANGE_CONTAINER_THRESHOLD
            ) {
                return this.markAndReturnContainer(tree)
            }
        }

        return this.findParentContainer(tree.parent)
    }

    /*
     * Same as above, but we are more desperate to find stuff now
     */
    private findParentContainerEager(tree: TextTree): TextTree | undefined {
        /*
         * Attempt to match "full width" containers
         */
        if (
            tree.styles !== undefined &&
            this.sourceTree.styles !== undefined &&
            this.sourceTree.styles.width > 0 &&
            tree.styles.width / this.sourceTree.styles.width > 0.5
        ) {
            return this.markAndReturnContainer(tree)
        }
        if (tree.parent === undefined) return undefined
        return this.findParentContainerEager(tree.parent)
    }

    //Finds the first link within each container
    private linkerize(containers: Container[]) {
        for (const container of containers) {
            if (container.title.link !== undefined) continue
            let link = this.findFirstLinkChildren(container.container)
            if (link !== undefined) {
                container.title.link = link
            }
        }
    }

    private findFirstLinkChildren(tree: TextTree): string | undefined {
        if (tree.children === undefined) return

        for (const child of tree.children) {
            if (child.link !== undefined) {
                return child.link
            }
            let link = this.findFirstLinkChildren(child)
            if (link) return link
        }
    }

    private imageize(containers: Container[]) {
        for (const container of containers) {
            let imagesAndWidths: ImagesWidths[] = []
            this.findAllImages(container.container, imagesAndWidths)
            imagesAndWidths.sort((a, b) => {
                return a.width >= b.width ? -1 : 1
            })

            if (imagesAndWidths.length > 0) container.title.src = imagesAndWidths[0].src
        }
    }

    private findAllImages(tree: TextTree, imagesAndWidths: ImagesWidths[]) {
        if (tree.children === undefined) return

        for (const child of tree.children) {
            if (child.src !== undefined) {
                imagesAndWidths.push({ src: child.src, width: child.styles!.width || 0 })
            }
            this.findAllImages(child, imagesAndWidths)
        }
    }

    private markAndReturnContainer(tree: TextTree): TextTree | undefined {
        if (tree.containerized)
            //Dont containerize the same thing twice
            return undefined

        tree.containerized = true
        this.markTreeAsContainerized(tree)
        return tree
    }

    //Mark entire tree as containerized, so no child trees
    private markTreeAsContainerized(tree: TextTree) {
        if (tree.children === undefined) return

        for (const child of tree.children) {
            child.containerized = true

            if (child.children) this.markTreeAsContainerized(child)
        }
    }

    private flattenContainers(containers: Container[]) {
        for (const { title, container } of containers) {
            if (!title.text) continue

            let content = { text: "", textArray: [] } //So we can pass by ref
            this.rollup(container, content)

            //Remove title from content
            content.textArray = content.textArray.filter(c => c !== title.text!.trim())

            let thisContainer: FlatContainer = {
                title: title.text.trim(),
                content: content.textArray
            }

            //Try to extract locations from content, try US style first
            let location = scanTextForUSLocation(content.textArray)
            if (!location) location = scanTextForCountryLocation(content.textArray)

            if (location) thisContainer.location = location

            if (title.link !== undefined) thisContainer.link = title.link

            if (title.src !== undefined) thisContainer.image = title.src

            if (config.IGNORE_CONTAINER_TITLES.includes(title.text.toLowerCase().trim())) continue
            //if its not empty
            if (title.text.replaceAll(" ", "") !== content.text.replaceAll(" ", ""))
                this.flatContainers.push(thisContainer)
        }
    }

    private rollup(container: TextTree, content: { text: string; textArray: Array<string> }) {
        if (container.children === undefined) return
        for (const child of container.children) {
            if (child === undefined) continue

            if (child.text && content.textArray.indexOf(child.text.trim()) === -1) {
                content.text += child.text + " "
                content.textArray.push(child.text.trim())
            }

            this.rollup(child, content)
        }
    }

    private removeFluffContainers(containers: FlatContainer[]) {
        //Loop backwards and delete to avoid items "shifting" during deletion
        let i = containers.length
        while (i--) {
            let container: FlatContainer = containers[i]
            //If it has no link and only one item of content delete it
            if (container.link === undefined && container.content.length <= 1) {
                containers.splice(i, 1)
            }
        }
    }

    /*
     * Exposure for testing purposes only
     */
    getContainers(): Container[] {
        return this.containers
    }

    log() {
        return {
            titles: this.titleNodes.length,
            containers: this.flatContainers.length
        }
    }
}
