import puppeteer, {Browser, Puppeteer} from "puppeteer"
import {extract} from "../extractor/extractor.js"
import {Parser} from "../parser/parser.js"
import { TextTree } from "../parser/types.js"
import config from "./config.json" assert {type:"json"}

export class Crawler {

    private browser: Browser

    private constructor(browser: Browser) {

        this.browser = browser
    }

    static async initialize() {

        const browser = await puppeteer.launch(config.PUPPETEER_ARGS)
        return new Crawler(browser)
    }

    async extract(url:string) {

        const page = await this.browser.newPage()
        await page.setViewport(config.PUPPETEER_VIEWPORT)
        await page.setUserAgent(config.USER_AGENT)
        await page.goto(url, {waitUntil: "networkidle0"});


        await page.content()

        const extracted = await page.evaluate(extract);
        await page.close()
        return extracted
    }
}

