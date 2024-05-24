import {Parser} from "../parser/parser.js"
import {describe, expect, test} from "bun:test"
import {makeBlock, makeImage, makeLink, makeText} from "./snippets.js"
import {scanTextForCountryLocation, scanTextForUSLocation} from "../parser/location/location_matching.js"

describe("Location parsing", () => {
    test("US Locations are parsed in content", () => {
        const location = scanTextForUSLocation(["Growth Lead, Tech. Los Angeles, CA. Engineering dept."])
        expect(location?.city).toBe("Los Angeles")
        expect(location?.state).toBe("CA")
        expect(location?.stateFull).toBe("California")

        const locationFullState = scanTextForUSLocation(["Test. Los Angeles, California. Engineering"])
        expect(locationFullState?.city).toBe("Los Angeles")
        expect(locationFullState?.state).toBe("CA")
        expect(locationFullState?.stateFull).toBe("California")
    })
    test("Locations are parsed in content", () => {
        let location = scanTextForCountryLocation(["Growth Lead, Tech. Dublin, Ireland. Engineering dept."])
        expect(location?.city).toBe("Dublin")
        expect(location?.state).toBeNil()
        expect(location?.country).toBe("Ireland")
        expect(location?.countryCode).toBe("IE")

        let uk = ["London, United Kingdom"]
        location = scanTextForCountryLocation(uk)

        expect(location).toBeObject()
        expect(location?.city).toBe("London")
        expect(location?.country).toBe("United Kingdom")
        expect(location?.countryCode).toBe("GB")
    })

    test("US Locations are parsed via parser", () => {
        const articleList = makeBlock("BODY", {}, [
            makeBlock("ARTICLE", {}, [
                makeText("Subtitle"),
                makeBlock("DIV", {size: 14}, [makeText("Some content. Dallas, TX. Some other content.")]),
                makeBlock("DIV", {size: 18}, [makeText("Another sub title")]),
                makeBlock("DIV", {size: 20}, [makeText("Title")])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].title).toBe("Title")
        expect(output[0].location).toBeObject()
        expect(output[0].location?.country).toBe("United States")
        expect(output[0].location?.city).toBe("Dallas")
        expect(output[0].location?.state).toBe("TX")
    })

    test("NonUS Locations are parsed via parser", () => {
        const articleList = makeBlock("BODY", {}, [
            makeBlock("ARTICLE", {}, [
                makeText("Subtitle"),
                makeBlock("DIV", {size: 14}, [makeText("Some content. Dublin, Ireland. Some other content.")]),
                makeBlock("DIV", {size: 18}, [makeText("Another sub title")]),
                makeBlock("DIV", {size: 20}, [makeText("Title")])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].title).toBe("Title")
        expect(output[0].location).toBeObject()
        expect(output[0].location?.country).toBe("Ireland")
        expect(output[0].location?.city).toBe("Dublin")
        expect(output[0].location?.state).toBeUndefined()
    })

    test("No locations are parsed when no locations exist", () => {
        const articleList = makeBlock("BODY", {}, [
            makeBlock("ARTICLE", {}, [
                makeText("Subtitle"),
                makeBlock("DIV", {size: 14}, [makeText("Some content. Testing, this. Some other content.")]),
                makeBlock("DIV", {size: 18}, [makeText("Another sub title")]),
                makeBlock("DIV", {size: 20}, [makeText("Title")])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].title).toBe("Title")
        expect(output[0].location).toBeUndefined()
    })
})
