# HTML to HRT

The idea is to parse complex HTML structures into human readable formats using visual cues.

## How it works
Rugged, general purpose web scraper that uses visual cues to parse web information. Regular scrapers
access information by pattern/location/class/name and therefore need to be 1) bespoke per website, 2)
break everytime the website changes, we take a different approach and have built a scraper that works
without customization.

## Running tests
To run the tests simply use the command
`bun test`

## Creating Field Tests
To create a new field test simply run
```bun tests/text-tree-generator.ts "https://myurl.com"```

This will create the appropriate directory and puppeteer will spool up to crawl the URL and
store 1) json render 2) html 3) a screenshot

You can then use this to construct field tests.




Name ideas:
    - gogojson.com
    - tojson.com (1.5k)
    - tojson.co
    - strux.co
    - struct.co
    - structurize.co
    - normalyz.com
    - strukt.co (100 bucks)
    - serialyz.com
    - parsalyze.com
    - jsonfox.com jsonjelly.com
    - jellyjelly.com
    - jellibot.com
    - jellyjson.com
    - conjectr.com
    - inferthis.com
    - scan / android keywords
    - jsondroid.com
    - scanjson.com
    - inferdroid.com
    - inferopus.com
    - jellyscanner.com
