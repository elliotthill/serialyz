import puppeteer from "puppeteer";
import {extract} from "./extractor.js";
import {Parser} from "./parser/parser.js";
import { TextTree } from "./parser/types.js";

const USER_AGENT = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36`;

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
    page.setUserAgent(USER_AGENT);
    page
    .on('console', message =>
        console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))

    await page.goto("https://gocoderemote.com/", {waitUntil: "networkidle0"});
    const html = await page.content();
    //await page.screenshot({path:"screenshot.png"});
    const extracted = await page.evaluate(extract);
    //writeFileSync('databricks.html', html);
    console.log(extracted);
    //walkExtracted(extracted);

    await browser.close();
    let stringExtract = JSON.stringify(extracted);
    console.log(stringExtract);
    let extractedTwo: TextTree= JSON.parse(stringExtract);
    let parser = new Parser(extractedTwo);
    let parsed = parser.parse();
    console.log(parsed);
})();
