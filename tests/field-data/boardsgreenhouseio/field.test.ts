import {Parser} from "../../../parser/parser.js"
import {describe, expect, test} from "bun:test"
import {TextTree} from "../../../parser/types.js"
import boardsgreenhouseio from "./boardsgreenhouseio.json" assert {type: "json"}

describe("boards.greenhouse.io field test", () => {
    test("Parse reddit job postings", () => {
        const parser = new Parser(boardsgreenhouseio as TextTree)
        const output = parser.parse()
        expect(output.length).toBe(149)
        expect(output[0].title).toBe("Training Specialist, Safety Enforcement")
        expect(output[4].title).toBe("Growth Lead, Brazil (Contract)")
    })
})
