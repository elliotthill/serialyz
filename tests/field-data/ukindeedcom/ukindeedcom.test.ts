import {Parser} from "../../../parser/parser.js";
import {describe, expect, test} from "bun:test";
import { TextTree } from "../../../parser/types.js";
import ukindeedcomFieldData from "./ukindeedcom.json" assert {type:"json"};

describe("indeed.com field test", () => {

    test("Parse homepage", () => {

        const parser = new Parser(ukindeedcomFieldData as TextTree);
        const output = parser.parse();
        expect(output.length).toBe(16);
        expect(output[0].title).toBe("Rooms Coordinator");
        expect(output[15].title).toBe("Library Assistant");
    });

});
