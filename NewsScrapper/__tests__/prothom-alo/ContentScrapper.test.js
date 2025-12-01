import { chromium } from "playwright";
import { ContentScrapper } from "../../prothom-alo/ContentScrapper";

describe("Prothom Alo Content Scrapper", () => {
    let browser;
    let page;
    let scrapper;

    beforeAll(async () => {
        browser = await chromium.launch({ headless: true });
    });

    beforeEach(async () => {
        page = await browser.newPage();
    });

    test("should scrap content from a valid article URL", async () => {
        scrapper = new ContentScrapper(page);
        const urlToScrap = "https://www.prothomalo.com/opinion/editorial/fs7rjf5est";
        const result = await scrapper.scrapContent(urlToScrap);

        expect(result).toHaveProperty("headline");
        expect(result).toHaveProperty("author");
        expect(result).toHaveProperty("content");

        expect(typeof result.headline).toBe("string");
        expect(typeof result.content).toBe("string");

        expect(result.headline.length).toBeGreaterThan(0);
        expect(result.content.length).toBeGreaterThan(0);
    }, 30 * 1000);

    test("should handle non-existent article URL gracefully", async () => {
        scrapper = new ContentScrapper(page);
        const urlToScrap = "https://www.prothomalo.com/opinion/article/non-existent-article";
        await expect(scrapper.scrapContent(urlToScrap)).rejects.toThrow();
    }, 60 * 1000);

    afterEach(async () => {
        await page?.close();
    });

    afterAll(async () => {
        await browser?.close();
    });
});
