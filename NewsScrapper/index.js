import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import cron from 'node-cron';
import { chromium } from "playwright";
import { scrapProthomAlo, processArticleLink, publishArticle} from "./prothom-alo/opinion-index.js";
import UrlRepository from "./db/UrlRepository.js";
import { UrlStatusEnum } from "./UrlStatusEnum.js";
import { processLinkSchema } from './schemas/processLinkSchema.js';
import { NewsSourceEnum } from './schemas/SourceEnum.js';
import logger from './logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Use cors package to allow frontend origin
app.use(cors({ origin: 'http://localhost:5173' }));

// Healthcheck endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

let cronSchedulingEnabled = false;
let isScrapping = false;

cron.schedule('* * * * *', async () => {
    if (!cronSchedulingEnabled) {
        logger.info("Scrapping is disabled. Skipping this run.");
        return;
    }

    if (isScrapping) {
        logger.info("Scrapping already in progress, skipping this run.");
        return;
    }
    isScrapping = true;
    logger.info("Starting scheduled scrapping task...");

    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await scrapProthomAlo(page);
        await browser.close();
        isScrapping = false;
        logger.info("Scheduled scrapping task completed.");
    } catch (err) {
        isScrapping = false;
        logger.error("Error during scheduled scrapping task:", err);
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
        logger.info(`Published: ${article?.headline} (${publishedId})`);
        await browser.close();
        // Update the URL entry status to COMPLETED
        await UrlRepository.updateUrl(link, source, UrlStatusEnum.COMPLETED, article);
        res.status(200).json({ status: 'completed', link, source, result: article });
    } catch (err) {
        logger.error('Process link error:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

app.get('/pending-urls', async (req, res) => {
    try {
        const { status, source, page = '1', limit = '10' } = req.query;
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const { items, total } = await UrlRepository.findUrls({ status, source, page: pageNum, limit: limitNum });

        // normalize _id to string
        const mapped = items.map(item => ({
            _id: item._id?.toString ? item._id.toString() : item._id,
            url: item.url,
            source: item.source,
            status: item.status,
            data: item.data || null,
        }));

        res.status(200).json({ status: 'ok', total, page: pageNum, limit: limitNum, items: mapped });
    } catch (err) {
        logger.error('Error fetching pending urls:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

app.get('/news-sources', (req, res) => {
    res.status(200).json({
        status: 'ok',
        sources: NewsSourceEnum
    });
});

// POST route to enable/disable scrapping
app.post('/scrapping-enabled', (req, res) => {
    const schema = z.object({ enabled: z.boolean() });
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ status: 'error', error: 'Invalid request body', details: parseResult.error.errors });
    }
    const { enabled } = parseResult.data;
    cronSchedulingEnabled = enabled;
    logger.info(`Scrapping enabled set to: ${cronSchedulingEnabled}`);
    res.status(200).json({ status: 'ok', scrappingEnabled: cronSchedulingEnabled });
});

// GET route to read current scrapping flag
app.get('/scrapping-enabled', (req, res) => {
    res.status(200).json({ status: 'ok', scrappingEnabled: cronSchedulingEnabled });
});

app.post('/pending-urls/:id/process', async (req, res) => {
    const { id } = req.params;
    try {
        const urlEntry = await UrlRepository.getById(id);
        if (!urlEntry) {
            return res.status(404).json({ status: 'error', error: 'URL entry not found' });
        }

        // Process the URL
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        const article = await processArticleLink(urlEntry.url, null, page, []);
        const publishedId = await publishArticle(article);
        logger.info(`Published: ${article?.headline} (${publishedId})`);
        await browser.close();

        // Update the URL entry status to COMPLETED
        await UrlRepository.updateUrl(urlEntry.url, urlEntry.source, UrlStatusEnum.COMPLETED, article);

        res.status(200).json({ status: 'ok', message: 'URL processed successfully', article });
    } catch (err) {
        logger.error('Error processing pending URL:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

app.delete('/pending-urls/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const urlEntry = await UrlRepository.getById(id);
        if (!urlEntry) {
            return res.status(404).json({ status: 'error', error: 'URL entry not found' });
        }

        // Delete the URL entry
        await UrlRepository.deleteById(id);

        res.status(200).json({ status: 'ok', message: 'URL entry deleted successfully' });
    } catch (err) {
        logger.error('Error deleting URL entry:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// Placeholder for future routes
// app.get('/other-route', ...)

app.listen(PORT, () => {
    logger.info(`Express server listening on port ${PORT}`);
});
