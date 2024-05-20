import config from "./config.json" assert {type: "json"}
import {Crawler} from "./crawler/crawler.js"
import {fetchURL, postURL} from "./utils/fetch-url.js"
import {Parser} from "./parser/parser.js"

let crawler = await Crawler.initialize()

const NODE_ENV = process.env.NODE_ENV
console.log(`Running in ${NODE_ENV} mode`)

const jobURL = new URL(NODE_ENV === "development" ? config.POLLING_URL_DEV : config.POLLING_URL)
const completeURL = NODE_ENV === "development" ? config.COMPLETE_URL_DEV : config.COMPLETE_URL

if (!process.env.NODE_ENV) throw Error("NODE_ENV not set")
if (!process.env.AWS_ACCESS_KEY_ID) throw Error("AWS credentials not set")
if (!process.env.AWS_SECRET_ACCESS_KEY) throw Error("AWS credentials not set")
if (!process.env.API_POLL_KEY) throw Error("No poll key")

type Job = {
    id: number
    url: string
}
const poll = async () => {
    let json
    try {
        const body = await fetchURL(jobURL)
        json = JSON.parse(body) as Job
    } catch (e) {
        console.error(e)
        setTimeout(poll, config.POLLING_WORKER_POLL_ON_ERR_MS)
        return
    }

    if (!json || !json.id) {
        setTimeout(poll, config.POLLING_WORKER_POLL_MS)
        return
    }

    const {id, url} = json
    const postToURL = new URL(completeURL.replace("{jobId}", id.toString()))
    console.log(`Stage 2 found ID:${id} and URL:${url}`)

    let extraction
    try {
        extraction = await crawler.extract(url, id)
    } catch (e) {
        await postURL(postToURL, {status: "error"})
        console.error(`Error occured during crawling ${e}`)
        setTimeout(poll, config.POLLING_WORKER_POLL_MS)
        return
    }

    let parser
    let parsed
    try {
        parser = new Parser(extraction)
        parsed = parser.parse()
    } catch (e) {
        console.error(`ParseError ${e}`)
        await postURL(postToURL, {status: "error"})
        setTimeout(poll, config.POLLING_WORKER_POLL_MS)
        return
    }

    console.log(`Stage 3 got parsed tree`)

    try {
        console.log(`Posting data to ${postToURL}`)
        const response = await postURL(postToURL, {structure: parsed, debug: parser.log()})
        console.log(response)
    } catch (e) {
        console.error("Error POSTing complete data")
        setTimeout(poll, config.POLLING_WORKER_POLL_MS)
        return
    }

    setTimeout(poll, config.POLLING_WORKER_POLL_MS)
}

setTimeout(poll, config.POLLING_WORKER_POLL_MS)

process.on("SIGINT", () => {
    console.log("Polling worker was killed")
    process.exit()
})
if (process.send) process.send("Hello from child as string")

process.on("message", message => {
    // print message from parent
    console.log(`Polling worker received message: ${message}`)
})
