import puppeteerVanilla, {Browser, Puppeteer} from "puppeteer"
import {addExtra} from "puppeteer-extra"
import adblock from "puppeteer-extra-plugin-stealth"
import stealth from "puppeteer-extra-plugin-stealth"

import {extract} from "../extractor/extractor.js"
import {Parser} from "../parser/parser.js"
import {TextTree} from "../parser/types.js"
import config from "./config.json" assert {type: "json"}
import {uploadToS3} from "../utils/upload_s3.js"

const puppeteer = addExtra(puppeteerVanilla)
puppeteer.use(adblock())
puppeteer.use(stealth())

export class Crawler {
    private browser: Browser

    private constructor(browser: Browser) {
        this.browser = browser
    }

    static async initialize() {
        const browser = await puppeteer.launch(config.PUPPETEER_ARGS)
        return new Crawler(browser)
    }

    async extract(url: string, jobId: number) {
        const urlObj = new URL(url)
        const domain = urlObj.hostname.replaceAll(".", "")

        const page = await this.browser.newPage()
        await page.setViewport(config.PUPPETEER_VIEWPORT)
        await page.setUserAgent(config.USER_AGENT)

        /// Wait for networkidle or until timeout
        console.time("wait")
        const waitForNetwork = page.goto(url, {waitUntil: "networkidle0", timeout: config.PUPPETEER_TIMEOUT})
        await Promise.race([waitForNetwork, Bun.sleep(config.PUPPETEER_PAGE_WAIT)])
        await page.content()
        console.timeEnd("wait")

        //Bot Evasion
        //await page.evaluate("window.scrollBy(1, window.innerHeight)")
        await page.evaluate("window.scrollTo(0,0)")
        await page.mouse.move(100, 100)

        const extracted = await page.evaluate(extract)

        //Screenshot async
        try {
            this.screenshot(page, `${config.SCREENSHOT_FOLDER}/${domain}.jpg`, `screenshots/${jobId}.jpg`)
        } catch (e) {
            console.error(`Screenshot produced error: ${e}`)
        }

        return extracted
    }

    screenshot(page: puppeteer.Page, source: string, destination: string) {
        console.log(`Screenshot ${source} => S3:${destination}`)

        page.screenshot({
            path: source,
            type: "jpeg",
            quality: 98
        })
            .then()
            .then(() => {
                uploadToS3(source, destination)
                    .then(result => {
                        console.log("Upload to S3 complete")
                    })
                    .catch(e => console.error(e))
            })
            .finally(() => {
                page.close().then()
            })
    }
}
