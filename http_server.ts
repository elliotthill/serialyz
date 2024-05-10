import {sleep, serve} from "bun"
import config from "./config.json" assert {type: "json"}
import {Crawler} from "./crawler/crawler.js"
import {Parser} from "./parser/parser.js"

let crawler = await Crawler.initialize()

serve({
    port: config.SERVICE_PORT,
    //hostname: config.SERVICE_HOST,
    async fetch(req: Request) {
        const start = performance.now()

        let json
        try {
            json = await req.json()
            console.log(json)
        } catch (e) {
            console.error("Could not find JSON")
            return new Response("Invalid request", {status: 500})
        }

        if (!json.url) return new Response("URL must be supplied", {status: 500})

        const extraction = await crawler.extract(json.url)

        const parser = new Parser(extraction)
        const parsed = parser.parse()

        const time = performance.now() - start
        const response = {
            meta: {time: time, status: "success"},
            result: {parsed}
        }
        console.log(`Result took ${time}ms`)
        console.log(process.memoryUsage())
        return new Response(JSON.stringify(parsed))
    }
})

process.on("SIGINT", () => {
    console.log("Ctrl-C was pressed")
    process.exit()
})

console.info(`Listening on ${config.SERVICE_HOST}:${config.SERVICE_PORT}`)
