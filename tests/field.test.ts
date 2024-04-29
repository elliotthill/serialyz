import { Parser } from "../parser/parser.js";
import {describe, expect, test} from "bun:test";
import {TextTree} from "../parser/types.js";
import gocoderemotecomFieldData from "./field-data/gocoderemotecom/gocoderemotecom.json" assert {type:"json"};
import indeedcomFieldData from "./field-data/ukindeedcom/ukindeedcom.json";
import youtubecomFieldData from "./field-data/youtubecom/youtubecom.json" assert {type:"json"};

describe("Parser Field Test", () => {

    test("Parse gocoderemote.com correctly", () => {

        const parser = new Parser(gocoderemotecomFieldData as TextTree);
        const output = parser.parse();

        expect(output.length).toBe(25);
        expect(output[0].title).toBe("Software Engineer");
        expect(output[24].title).toBe("Full Stack Developer");
    });

    test("Parse indeed correctly", () => {

        const parser = new Parser(indeedcomFieldData as TextTree);
        const output = parser.parse();
        expect(output.length).toBe(16);
        expect(output[0].title).toBe("Head of Employee Relations");
        expect(output[15].title).toBe("Client Partner - Growth");
    });

    test("Parse youtube", () => {

        let parser = new Parser(youtubecomFieldData as TextTree);
        parser = new Parser(youtubecomFieldData as TextTree);
        const output = parser.parse();
        expect(output.length).toBeLessThanOrEqual(25);
        expect(output.length).toBeGreaterThanOrEqual(22); //We are picking up ads :(

        let firstPostIndex = 0;
        if (output[0].title.startsWith("Get our fastest ever broadband"))
            firstPostIndex = 1;
        expect(output[firstPostIndex].title).toBe("Ukraine is Just the Beginning - Russia's TRUE MOTIVE Behind the War");
        //expect(output[15].title).toBe("Client Partner - Growth");
    });

});
