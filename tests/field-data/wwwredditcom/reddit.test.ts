import {Parser} from "../../../parser/parser.js"
import {describe, expect, test} from "bun:test"
import {TextTree} from "../../../parser/types.js"
import redditcomFieldData from "./wwwredditcom.json" assert {type: "json"}

describe("reddit.com field test", () => {
    test("Parse homepage", () => {
        const parser = new Parser(redditcomFieldData as TextTree)
        const output = parser.parse()

        expect(output.length).toBe(35)
        expect(output[0].title).toBe("Maya Rudolph on SNL")
        expect(output[1].title).toStartWith("Sabrina Carpenter")
        expect(output[7].title).toStartWith("Do ice-cream turf") //The first actual post
    })
})
