import {Parser} from "../../../parser/parser.js";
import {describe, expect, test} from "bun:test";
import { TextTree } from "../../../parser/types.js";
import gocoderemotecomFieldData from "./gocoderemotecom.json" assert {type:"json"};

describe("gocoderemote.com field test", () => {

    test("Parse homepage", () => {

        const parser = new Parser(gocoderemotecomFieldData as TextTree);
        const output = parser.parse();
        expect(output.length).toBe(25);
        expect(output[0].title).toBe("Software Engineer");
        expect(output[24].title).toBe("Full Stack Developer");
    });

});
