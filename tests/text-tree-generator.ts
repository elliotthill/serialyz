import puppeteer from "puppeteer"
import {extract} from "../extractor.js"
import {Parser} from "../parser/parser.js"
import {TextTree} from "../parser/types.js"
import fs, {writeFileSync} from "fs"
import path from "path"

const USER_AGENT = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36`
const url = process.argv.slice(2)[0]
const domain = new URL(url).hostname.replaceAll(".", "")
const fieldDataPath = path.join("tests/field-data/", domain)

const makeFieldDataPath = (fullPath: string) => {
    if (!fs.existsSync(fullPath)) {
        console.info(`Creating directory ${fullPath}`)
        fs.mkdirSync(fullPath, {recursive: false})
    }
}

;(async () => {
    const browser = await puppeteer.launch({
        args: ["--window-size=1680,1080"]
    })
    const page = await browser.newPage()
    await page.setViewport({
        width: 1680,
        height: 1080
    })
    page.setUserAgent(USER_AGENT)
    page.on("console", (message) =>
        console.log(`Chrome reported: ${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
    )

    await page.goto(url, {waitUntil: "networkidle0"})
    const html = await page.content()
    const extracted = await page.evaluate(extract)

    makeFieldDataPath(fieldDataPath)
    await page.screenshot({path: `${fieldDataPath}/${domain}.jpg`, type: "jpeg", quality: 90})
    writeFileSync(`${fieldDataPath}/${domain}.html`, html)
    writeFileSync(`${fieldDataPath}/${domain}.json`, JSON.stringify(extracted))

    await browser.close()
})()
