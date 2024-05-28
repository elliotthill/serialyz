import {Parser} from "../../../parser/parser.js"
import {describe, expect, test} from "bun:test"
import {TextTree} from "../../../parser/types.js"
import gocoderemotecomFieldData from "./gocoderemotecom.json" assert {type: "json"}

describe("gocoderemote.com field test", () => {
    test("Parse homepage", () => {
        const parser = new Parser(gocoderemotecomFieldData as TextTree)
        const output = parser.parse()
        expect(output.length).toBe(25)
        expect(output[0].title).toBe("Product Manager")
        expect(output[0].location?.city).toBe("Los Gatos")
        expect(output[1].title).toBe("Software Engineer")
        expect(output[24].title).toBe("Director of Engineering")
    })
})
