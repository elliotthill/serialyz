import {Parser} from "../../../parser/parser.js";
import {describe, expect, test} from "bun:test";
import { TextTree } from "../../../parser/types.js";
import redditcomFieldData from "./wwwredditcom.json" assert {type:"json"};

describe("Reddit field test", () => {

    test("Homepage test", () => {

        //let parserTitle = new Parser(redditcomFieldData as TextTree);
        //parserTitle.preprocess();
        //console.log(parserTitle.titles());
        //return;


        const parser = new Parser(redditcomFieldData as TextTree);
        const output = parser.parse();
        //console.log(output);
        expect(output.length).toBe(35);
        expect(output[0].title).toBe("Murray's game-winner");
        expect(output[6].title).toStartWith("What's something you think is totally");
        //expect(output[34].title).toBe("Promoted");

    });

});
