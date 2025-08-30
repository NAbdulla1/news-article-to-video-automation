import 'dotenv/config';
import express from 'express';
import { chromium } from "playwright";
import { scrapProthomAlo, processArticleLink, publishArticle} from "./prothom-alo/opinion-index.js";
import UrlRepository from "./db/UrlRepository.js";
import { UrlStatusEnum } from "./UrlStatusEnum.js";
import { processLinkSchema } from './schemas/processLinkSchema.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

app.post('/process-failed/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Find the row with the given id and failed status
        const db = await UrlRepository.collection;
        const row = await db.findOne({ _id: id, status: UrlStatusEnum.FAILED });
        if (!row) {
            return res.status(404).json({ status: 'not found or not failed' });
        }
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        const article = await processArticleLink(row.url, row.data, page, []);
        const publishedId = await publishArticle(article);
        console.log(`Published: ${article?.headline} (${publishedId})`);
        await browser.close();
        res.status(200).json({ status: 'processed', id });
    } catch (err) {
        console.error("Process failed article error:", err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

app.post('/process-link', async (req, res) => {
    const parseResult = processLinkSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ status: 'error', error: 'Invalid request body', details: parseResult.error.errors });
    }
    const { link, source = 'prothom-alo' } = parseResult.data;
    try {
        // Insert the link into the database with pending status and provided source
        await UrlRepository.insertUrl({ url: link, source, status: UrlStatusEnum.PENDING });
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        const article = await processArticleLink(link, null, page, []);
        const publishedId = await publishArticle(article);
        console.log(`Published: ${article?.headline} (${publishedId})`);
        await browser.close();
        res.status(200).json({ status: 'processed', link, source, result: article });
    } catch (err) {
        console.error('Process link error:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

app.get('/pending-urls', async (req, res) => {
    try {
        const urls = await UrlRepository.getNonCompletedUrls();
        res.status(200).json({ status: 'ok', urls });
    } catch (err) {
        console.error('Error fetching pending urls:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// Placeholder for future routes
// app.get('/other-route', ...)

app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
});
