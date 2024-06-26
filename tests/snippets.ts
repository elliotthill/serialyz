import {TextTree, ElementType} from "../parser/types.js"
/**
 * Functions for building snippets to test the parser against
 */

export const makeBlock = (tag: string, style: {}, children: TextTree[]) => {
    let defaultStyles = {border: 0, borderRadius: 0, weight: 600, size: 16, width: 100}
    style = Object.assign(defaultStyles, style)

    return {
        type: "block" as ElementType,
        tag: tag || "DIV",
        styles: style,
        children: children || undefined
    } as TextTree
}

export const makeLink = (tag: string, style: {}, link: string, children: TextTree[]) => {
    let defaultStyles = {border: 0, borderRadius: 0, weight: 600, size: 16, width: 100}
    style = Object.assign(defaultStyles, style)

    return {
        type: "block" as ElementType,
        tag: tag || "DIV",
        styles: style,
        children: children || undefined,
        link: link
    } as TextTree
}

export const makeImage = (tag: string, style: {}, src: string, children: TextTree[]) => {
    let defaultStyles = {border: 0, borderRadius: 0, weight: 600, size: 16, width: 100}
    style = Object.assign(defaultStyles, style)

    return {
        type: "block" as ElementType,
        tag: tag || "DIV",
        styles: style,
        children: children || undefined,
        src: src
    } as TextTree
}

export const makeText = (text: string) => {
    return structuredClone({type: "text" as ElementType, text: text} as TextTree)
}
