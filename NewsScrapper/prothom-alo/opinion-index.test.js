
import { chromium } from "playwright";
import { MongoMemoryServer } from "mongodb-memory-server";

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

let mockDATABASE_URL;
jest.mock('../config.js', () => ({
    DATABASE_URL: mockDATABASE_URL,
    TIMEOUT: "30000"
}));

let mongod;
let scrapProthomAlo;

describe("Prothom Alo Opinion Page Scrapper", () => {
    let browser;
    let page;
    beforeAll(async () => {
        browser = await chromium.launch({ headless: true });
        // start in-memory MongoDB
        mongod = await MongoMemoryServer.create();

        // set mocked DATABASE_URL dynamically
        mockDATABASE_URL = mongod.getUri();

        // now import the module, we are importing it after ensuring that the DATABASE_URL is set from in-memory mongodb server
        const opinionIndex = await import("../prothom-alo/opinion-index.js");
        scrapProthomAlo = opinionIndex.scrapProthomAlo;
        jest.resetModules();
    }, 30 * 1000); // the timeout is neccessary for downloading the mongodb-memory-server

    beforeEach(async () => {
        page = await browser.newPage();
    });

    test("should scrap opinion article links and insert new URLs into the database", async () => {
        const result = await scrapProthomAlo(page);
        expect(Array.isArray(result)).toBe(true);
    }, 60 * 1000);

    afterEach(async () => {
        await page?.close();
    });

    afterAll(async () => {
        await mongod?.stop();
        await browser?.close();
    });
});
