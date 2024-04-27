import {TextTree, Container, FlatContainer, TextTreeStyles} from "./parser/types.js";

export const extract = async () => {
    const tagBlacklist = ["HEADER", "BUTTON", "SCRIPT", "FORM", "INPUT", "FOOTER"];

    let textTree: TextTree = {} as TextTree;

    const walk = (node: Node, func: (node: Node, textTree: TextTree) => void, textTree: TextTree) => {

        if (node.nodeType === Node.ELEMENT_NODE && tagBlacklist.includes((<HTMLElement>node).tagName))
            return;

        const children = node.childNodes;
        func(node, textTree);
        textTree.children = [];

        for (var i = 0; i < children.length; i++) { // Children are siblings to each other
            textTree.children[i] = {} as TextTree;
            walk(children[i], func, textTree.children[i]);
        }
    }

    const isEmpty = (str: string) => !str.replace(/\s/g, '').length

    const getStyle = (node: Node, style: string): string => {

        return getComputedStyle(<HTMLElement>node).getPropertyValue(style).replace("px", "");
    }

    const getStylePx = (node: Node, style: string): number => {

        return parseInt(getStyle(node, style)) || 0;
    }

    const nodeProc = (node: Node, appendTo: TextTree) => {

        if (node.nodeType === Node.ELEMENT_NODE) {
            //appendTo.debug = node;
            appendTo.type = "block";
            appendTo.tag = (<HTMLElement>node).tagName;

            let combinedBorder = getStylePx(node, "border-bottom-width") +
                getStylePx(node, "border-top-width") + getStylePx(node, "border-left-width") +
                getStylePx(node, "border-right-width");

            let combinedBorderRadius = getStylePx(node, "border-top-left-radius") +
                getStylePx(node, "border-bottom-right-radius");

            appendTo.styles = <TextTreeStyles>{
                border: combinedBorder,
                borderRadius: combinedBorderRadius,
                weight: getStylePx(node, "font-weight"),
                size: getStylePx(node, "font-size"),
                width: getStylePx(node, "width"),
            };
        }

        if (node.nodeType === Node.TEXT_NODE && node.textContent !== null && !isEmpty(node.textContent)) {
            appendTo.text = node.textContent;
            //appendTo.debug = node;
            appendTo.type = "text";
        }
    }

    walk(document.body, nodeProc, textTree); //Prints out every node
    return Promise.resolve(textTree);
}
