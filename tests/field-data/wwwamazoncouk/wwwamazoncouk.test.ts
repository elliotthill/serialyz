import {Parser} from "../../../parser/parser.js"
import {describe, expect, test} from "bun:test"
import {TextTree} from "../../../parser/types.js"
import amazoncoukFieldData from "./wwwamazoncouk.json" assert {type: "json"}

describe("amazon.co.uk field test", () => {
    test("Parse homepage", () => {
        const parser = new Parser(amazoncoukFieldData as TextTree)
        const output = parser.parse()

        expect(output[2].title).toStartWith("COMFEE' Mini Plus Dishwasher")
        expect(output[3].title).toStartWith("Hermitlux Table Top")
        expect(output.length).toBeGreaterThanOrEqual(26)
    })
})
