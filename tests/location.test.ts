import {Parser} from "../parser/parser.js"
import {describe, expect, test} from "bun:test"
import {makeBlock, makeImage, makeLink, makeText} from "./snippets.js"
import {scanTextForCountryLocation, scanTextForUSLocation} from "../parser/location/location_matching.js"

describe("Location parsing", () => {
    test("US Locations are parsed in content", () => {
        const location = scanTextForUSLocation(["Growth Lead, Tech. Los Angeles, CA. Engineering dept."])
        expect(location?.city).toBe("Los Angeles")
        expect(location?.state).toBe("CA")
    })
    test("Locations are parsed in content", () => {
        const location = scanTextForCountryLocation(["Growth Lead, Tech. Dublin, Ireland. Engineering dept."])
        expect(location?.city).toBe("Dublin")
        expect(location.state).toBeNil()
        expect(location.country).toBe("Ireland")
    })
})
