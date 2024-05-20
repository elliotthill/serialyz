import {Parser} from "../../../parser/parser.js"
import {describe, expect, test} from "bun:test"
import {TextTree} from "../../../parser/types.js"
import jobsnetflixFieldData from "./jobsnetflixcom.json" assert {type: "json"}

describe("jobs.netflix.com field test", () => {
    test("Parse homepage", () => {
        const parser = new Parser(jobsnetflixFieldData as TextTree)
        const output = parser.parse()
        expect(output.length).toBe(20)
        expect(output[0].title).toBe("Senior Analyst, Sales Incentive Compensation")
        expect(output[19].title).toBe("Senior Manager, Dubbing Partner Operations - APAC")
    })
})
