import puppeteer from "puppeteer";
import {extract} from "../extractor/extractor.js";
import {Parser} from "../parser/parser.js";
import { TextTree } from "../parser/types.js";
import config from "./config.json" assert {type:"json"};

const USER_AGENT = config.USER_AGENT;

const url = process.argv[2];

if (!url)
    throw Error("No URL supplied");

(async () => {
    const browser = await puppeteer.launch({
        args: [
            '--window-size=1680,1080',
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1680,
        height: 1080,
    });
    await page.setUserAgent(USER_AGENT);
    page
    .on('console', message =>
        console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))

    await page.goto(url, {waitUntil: "networkidle0"});
    const html = await page.content();

    const extracted = await page.evaluate(extract);

    await browser.close();
    let parser = new Parser(extracted);
    let parsed = parser.parse();
    console.log(parsed);
})();
