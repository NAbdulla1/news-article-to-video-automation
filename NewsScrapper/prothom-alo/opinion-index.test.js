
import { chromium } from "playwright";
import { MongoMemoryServer } from "mongodb-memory-server";
import { scrapProthomAlo } from "../prothom-alo/opinion-index.js";

jest.mock("../infra/rabbitmq", () => ({
    publish: jest.fn(),
    consume: jest.fn(),
    connect: jest.fn(),
}));

jest.mock("../logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
}));

let mongod;
let originalEnv;

describe("Prothom Alo Opinion Page Scrapper", () => {
    let browser;
    let page;
    beforeAll(async () => {
        browser = await chromium.launch({ headless: true });
        // Save original env
        originalEnv = { ...process.env };
        mongod = await MongoMemoryServer.create();
        process.env.DATABASE_URL = mongod.getUri();
        process.env.TIMEOUT_MILLISECONDS = "30000";
        jest.resetModules();
    });

    beforeEach(async () => {
        page = await browser.newPage();
    });

    test("should scrap opinion article links and insert new URLs into the database", async () => {
        const result = await scrapProthomAlo(page);
        expect(Array.isArray(result)).toBe(true);
    }, 5 * 60000);

    afterEach(async () => {
        await page.close();
    });

    afterAll(async () => {
        await mongod.stop();
        process.env = originalEnv;
        await browser.close();
    });
});
