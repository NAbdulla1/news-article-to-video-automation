import 'dotenv/config';
import express from 'express';
import { chromium } from "playwright";
import { scrapProthomAlo } from "./prothom-alo/opinion-index.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Healthcheck endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Start scrapping on POST request
app.post('/scrap', async (req, res) => {
    try {
        console.log("Received request to start scrapping...");
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        res.status(200).json({ status: 'scrapping started' });
        await scrapProthomAlo(page);
        await browser.close();
        console.log("scrapper finished.");
    } catch (err) {
        console.error("Scrapper error:", err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// Placeholder for future routes
// app.get('/other-route', ...)

app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
});
