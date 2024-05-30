import {Parser} from "../../../parser/parser.js"
import {describe, expect, test} from "bun:test"
import {TextTree} from "../../../parser/types.js"
import linkedInFieldData from "./wwwlinkedincom.json" assert {type: "json"}

describe("linkedin.com field test", () => {
    test("Parse homepage", () => {
        const parser = new Parser(linkedInFieldData as TextTree)
        const output = parser.parse()
        //This is messy page
        expect(output.length).toBeGreaterThan(60)
        expect(output.length).toBeLessThan(75)
        expect(output[0].title).toBe("Software Engineer - Recent Graduate")
        expect(output[0].title).toBe("Software Engineer - Recent Graduate")
        expect(output[3].title).toBe("Full Stack Software Engineer")
    })
})
