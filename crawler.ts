import puppeteer from "puppeteer";
import {extract} from "./extractor.js";
import {testExtract} from "./test_extract.js";
import {Parser} from "./parser/parser.js";

const USER_AGENT = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36`;

(async () => {
    const browser = await puppeteer.launch({
        args: [
            '--window-size=1920,1080',
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
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
    let parser = new Parser(extracted);
    let parsed = parser.parse();
    console.log(parsed);
})();
