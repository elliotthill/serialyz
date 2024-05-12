import {Parser} from "../../../parser/parser.js"
import {describe, expect, test} from "bun:test"
import {TextTree} from "../../../parser/types.js"
import tiwibcomFieldData from "./wwwthisiswhyimbrokecom.json" assert {type: "json"}

describe("reddit.com field test", () => {
    test("Parse homepage", () => {
        const parser = new Parser(tiwibcomFieldData as TextTree)
        const output = parser.parse()

        expect(output.length).toBe(24)
        expect(output[0].title).toBe("DIY Vasectomy Kit")
        expect(output[1].title).toBe("Big Book Of Breasts 3D")
        expect(output[2].title).toBe("Color Changing Light Panels")

        expect(output[23].title).toBe("Geeky Lingerie")
    })
})
