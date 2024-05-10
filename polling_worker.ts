import config from "./config.json" assert {type: "json"}
import {Crawler} from "./crawler/crawler.js"
import {fetchURL, postURL} from "./utils/fetch-url.js"
import {Parser} from "./parser/parser.js"

let crawler = await Crawler.initialize()

const NODE_ENV = process.env.NODE_ENV

const jobURL = new URL(NODE_ENV === "development" ? config.POLLING_URL_DEV : config.POLLING_URL)
const completeURL = NODE_ENV === "development" ? config.COMPLETE_URL_DEV : config.COMPLETE_URL

if (!process.env.NODE_ENV) throw Error("NODE_ENV not set")

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
    console.log(`Stage 2 found ID:${id} and URL:${url}`)

    let extraction
    try {
        extraction = await crawler.extract(url)
    } catch (e) {
        let postToURL = new URL(completeURL.replace("{jobId}", id.toString()))
        await postURL(postToURL, {status: "error"})
        console.error(`Error occured during crawling ${e}`)
        setTimeout(poll, config.POLLING_WORKER_POLL_MS)
        return
    }

    const parser = new Parser(extraction)
    const parsed = parser.parse()

    console.log(`Stage 3 got parsed tree`)

    try {
        let postToURL = new URL(completeURL.replace("{jobId}", id.toString()))
        console.log(`Posting data to ${postToURL}`)
        const response = await postURL(postToURL, parsed)
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
    console.log("Ctrl-C was pressed")
    process.exit()
})