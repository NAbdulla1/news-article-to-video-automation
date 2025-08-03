import 'dotenv/config';
import { chromium } from "playwright";
import { scrapProthomAlo } from "./prothom-alo/opinion-index.js";
import { publish } from "../../shared/rabbitmq.js";
import { tts } from "../../shared/config.js";
import crypto from 'crypto';

console.log("starting...");

const browser = await chromium.launch({
    headless: true,
});

const page = await browser.newPage();
const scrappedData = await scrapProthomAlo(page);

if (scrappedData && scrappedData.length > 0) {
    try {
        for (const article of scrappedData) {
            const id = crypto.randomUUID();
            await publish(tts.inputRoutingKey, { ...article, id });
            console.log(`Sent: ${article.headline} (${id})`);
        }
    } catch (error) {
        console.error("Error publishing to RabbitMQ:", error);
    }
}

await browser.close();
