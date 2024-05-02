import {Parser} from "../../../parser/parser.js";
import {describe, expect, test} from "bun:test";
import { TextTree } from "../../../parser/types.js";
import amazoncoukFieldData from "./wwwamazoncouk.json" assert {type:"json"};

describe("reddit.com field test", () => {

    test("Parse homepage", () => {
        const parser = new Parser(amazoncoukFieldData as TextTree);
        const output = parser.parse();

        //console.log(output);
        expect(output[1].title).toStartWith("Hisense HS622E90WUK");
        expect(output.length).toBeGreaterThanOrEqual(26);

    });

});
