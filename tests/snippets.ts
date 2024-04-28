
import { TextTree, ElementType } from "../parser/types.js";
/**
 * Functions for building snippets to test the parser against
 */


export const makeBlock = (tag: string, style: {}, children: TextTree[]) => {

    let defaultStyles = {border:0,borderRadius:0,weight:600,size:16,width:100};
    style = Object.assign(defaultStyles, style);

    return {type:"block" as ElementType,tag:tag||"DIV",styles:style,children:children||undefined} as TextTree;
}

export const makeText = (text: string) => {

    return {type:"text" as ElementType, text:text} as TextTree;
}

makeBlock("BODY",{}, [
            makeBlock("ARTICLE",{},[makeText("Title")])

    ]);

