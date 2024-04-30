import { Parser } from "../parser/parser.js";
import {describe, expect, test} from "bun:test";
import {TextTree} from "../parser/types.js";
import gocoderemotecomFieldData from "./field-data/gocoderemotecom/gocoderemotecom.json" assert {type:"json"};
import indeedcomFieldData from "./field-data/ukindeedcom/ukindeedcom.json" assert {type:"json"};
import youtubecomFieldData from "./field-data/wwwyoutubecom/wwwyoutubecom.json" assert {type:"json"};

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
        expect(output[0].title).toBe("Rooms Coordinator");
        expect(output[15].title).toBe("Library Assistant");
    });

    test("Parse youtube", () => {

        let parser = new Parser(youtubecomFieldData as TextTree);
        const output = parser.parse();
        expect(output.length).toBeGreaterThanOrEqual(30); //We are picking up ads :(


        //expect(output[15].title).toBe("Client Partner - Growth");
    });

});
