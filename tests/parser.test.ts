import { Parser } from "../parser/parser.js";
import {describe, expect, test} from "bun:test";
import {makeBlock, makeText} from "./snippets.js";

describe("testing ", () => {

    test("One article in body", () => {

        //Make a simple list of articles
        const articleList = makeBlock("BODY",{}, [
            makeBlock("ARTICLE",{},[makeText("Title")])
        ]);

        const parser = new Parser(articleList);
        const output = parser.parse();
        console.log(output);
        expect(output.length).toBe(1);
        expect(output[0].title).toBe("Title");

    });
});
