import 'dotenv/config';

import { chromium } from "playwright";

import { scrapProthomAlo } from "./prothom-alo/opinion-index.js";

console.log("starting...");
const browser = await chromium.launch({
    headless: true,
});

const page = await browser.newPage();

const scrappedData = await scrapProthomAlo(page);

console.log(scrappedData.map(sc => sc.author));

await browser.close();
