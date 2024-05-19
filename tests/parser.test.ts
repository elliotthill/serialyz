import {Parser} from "../parser/parser.js"
import {describe, expect, test} from "bun:test"
import {makeBlock, makeImage, makeLink, makeText} from "./snippets.js"

describe("Parser", () => {
    test("Article tags are parsed", () => {
        //Make a simple list of articles
        // prettier-ignore
        const articleList = makeBlock("BODY", {}, [
            makeBlock("ARTICLE", {}, [
                makeText("Title"),
                makeText("Subtitle"),
                makeText("Description")
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()
        expect(output.length).toBe(1)
        expect(output[0].title).toBe("Title")
    })

    test("Largest text in a container is title", () => {
        //Make a simple list of articles
        const articleList = makeBlock("BODY", {}, [
            makeBlock("ARTICLE", {}, [
                makeText("Subtitle"),
                makeBlock("DIV", {size: 14}, [makeText("Some content")]),
                makeBlock("DIV", {size: 18}, [makeText("Another sub title")]),
                makeBlock("DIV", {size: 20}, [makeText("Title")])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].title).toBe("Title")
    })

    test("<article> and <li> take precedence", () => {
        const articleList = makeBlock("BODY", {}, [
            makeBlock("ARTICLE", {}, [
                makeText("This is the primary content"),
                makeBlock("DIV", {border: 1}, [
                    makeText("Subtitle"),
                    makeBlock("DIV", {size: 14}, [makeText("Some content")]),
                    makeBlock("DIV", {size: 18}, [makeText("Another sub title")]),
                    makeBlock("DIV", {size: 20}, [makeText("Title")])
                ])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].title).toBe("Title")
        expect(output[0].content[0]).toStartWith("This is the primary content")
    })

    test("Special tags propogate", () => {
        //Make a simple list of articles
        // prettier-ignore
        const articleList = makeBlock("BODY", {}, [
            makeBlock("ARTICLE", {}, [
                makeText("Subtitle"),
                makeBlock("DIV", { size: 20 }, [
                    makeText("Title")
                ]),
                makeBlock("DIV", {}, [
                    makeText("Subtitle"),
                    makeText("Main content here")
                ])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()
        const containers = parser.getContainers()
        expect(output.length).toBe(1)
        expect(containers[0].title.specialParent).toBe("ARTICLE")
    })

    test("Border match container without special tags", () => {
        const articleList = makeBlock("BODY", {}, [
            makeBlock("DIV", {border: 1}, [
                makeText("This is the primary content"),
                makeBlock("DIV", {}, [
                    makeText("Subtitle"),
                    makeBlock("DIV", {size: 14}, [makeText("Some content")]),
                    makeBlock("DIV", {size: 18}, [makeText("Another sub title")]),
                    makeBlock("DIV", {size: 20}, [makeText("Title")])
                ])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].title).toBe("Title")
        expect(output[0].content[0]).toStartWith("This is the primary content")
    })

    test("Match all possible containers", () => {
        const twentyArticles = []
        for (let i = 0; i < 20; i++) {
            twentyArticles.push(
                // prettier-ignore
                makeBlock("DIV", { border: 1 }, [
                    makeBlock("DIV", { size: 18 }, [makeText("Another sub title")]),
                    makeBlock("DIV", { size: 20 }, [makeText("Title")]),
                    makeBlock("DIV", {}, [makeText("This is the main story")])
                ])
            )
        }
        const articleList = makeBlock("BODY", {}, [makeBlock("DIV", {border: 1}, twentyArticles)])

        const parser = new Parser(articleList)
        const output = parser.parse()
        expect(output.length).toBe(20)
        expect(output[19].title).toBe("Title")
        expect(output[19].content[0]).toStartWith("Another sub title")
    })

    test("Extract link from title (title takes priority)", () => {
        const articleList = makeBlock("BODY", {}, [
            makeLink("DIV", {border: 1}, "https://test.com", [
                makeText("This is the primary content"),
                makeBlock("DIV", {}, [
                    makeText("Subtitle"),
                    makeBlock("DIV", {size: 14}, [makeText("Some content")]),
                    makeBlock("DIV", {size: 18}, [makeText("Another sub title")]),
                    makeBlock("DIV", {size: 20}, [makeText("Title")]),
                    makeLink("A", {size: 12}, "https://shouldnotbethis.com", [makeText("Hey")])
                ])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].link).toBe("https://test.com")
    })

    test("Extract link from within container (if no title link)", () => {
        const articleList = makeBlock("BODY", {}, [
            makeBlock("DIV", {border: 1}, [
                makeText("This is the primary content"),
                makeBlock("DIV", {}, [
                    makeText("Subtitle"),
                    makeBlock("DIV", {size: 14}, [makeText("Some content")]),
                    makeBlock("DIV", {size: 18}, [makeText("Another sub title")]),
                    makeBlock("DIV", {size: 20}, [makeText("Title")]),
                    makeLink("A", {size: 12}, "https://test.com", [makeText("Hey")])
                ])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].link).toBe("https://test.com")
    })

    test("Extract link on title", () => {
        const articleList = makeBlock("BODY", {}, [
            makeBlock("DIV", {border: 1}, [
                makeText("Thing"),
                makeBlock("DIV", {}, [
                    makeBlock("DIV", {size: 14}, [makeText("Some content")]),
                    makeBlock("DIV", {size: 20}, [makeText("Cowabunga")]),
                    makeLink("A", {size: 25}, "https://test.com", [makeText("Hey")])
                ])
            ])
        ])
        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].title).toBe("Hey")
        expect(output[0].link).toBe("https://test.com")
    })

    test("Fluff does not become a container", () => {
        const articleList = makeBlock("BODY", {}, [
            makeBlock("ARTICLE", {border: 1}, [
                makeBlock("DIV", {}, [makeBlock("DIV", {size: 14}, [makeText("Some fluf")])])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(0)
    })

    test("Title should not be added to container content", () => {
        const articleList = makeBlock("BODY", {}, [
            makeBlock("DIV", {border: 1}, [
                makeText("Thing"),
                makeBlock("DIV", {}, [
                    makeBlock("DIV", {size: 14}, [makeText("Some content")]),
                    makeBlock("DIV", {size: 20}, [makeText("Cowabunga")]),
                    makeLink("A", {size: 12}, "https://test.com", [makeText("Hey")])
                ])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].title).toBe("Cowabunga")
        expect(output[0].content).toEqual(["Thing", "Some content", "Hey"])
    })

    test("Image is found in container", () => {
        //Make a simple list of articles
        const articleList = makeBlock("BODY", {}, [
            makeBlock("ARTICLE", {}, [
                makeText("Subtitle"),
                makeImage("IMG", {width: 100}, "https://image.jpg", []),
                makeBlock("DIV", {size: 18}, [makeText("Another sub title")]),
                makeBlock("DIV", {size: 20}, [makeText("Title")])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].image).toBe("https://image.jpg")
    })

    test("Largest Image is found in container", () => {
        //Make a simple list of articles
        const articleList = makeBlock("BODY", {}, [
            makeBlock("ARTICLE", {}, [
                makeText("Subtitle"),
                makeImage("IMG", {width: 100}, "https://no.jpg", []),
                makeImage("IMG", {width: 300}, "https://image.jpg", []),
                makeImage("IMG", {width: 200}, "https://no.jpg", []),
                makeBlock("DIV", {size: 18}, [makeText("Another sub title")]),
                makeBlock("DIV", {size: 20}, [makeText("Title")])
            ])
        ])

        const parser = new Parser(articleList)
        const output = parser.parse()

        expect(output.length).toBe(1)
        expect(output[0].image).toBe("https://image.jpg")
    })
})
