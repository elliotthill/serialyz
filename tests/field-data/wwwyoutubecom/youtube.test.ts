import {Parser} from "../../../parser/parser.js";
import {describe, expect, test} from "bun:test";
import { TextTree } from "../../../parser/types.js";
import youtubecomFieldData from "./wwwyoutubecom.json" assert {type:"json"};

describe("youtube.com field test", () => {

    test("Parse homepage", () => {

        /*
        * Parsing youtube search pages is a nightmare, its full of sidebars, top bars,
        * ad slots, sliders etc.
        *
        * Just set it to >30 items for now
        */

        let parser = new Parser(youtubecomFieldData as TextTree);
        const output = parser.parse();
        expect(output.length).toBeGreaterThanOrEqual(30); //We are picking up ads :(
    });

});
