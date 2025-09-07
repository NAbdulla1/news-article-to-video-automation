import { chromium } from "playwright";
import { InterviewContentScrapper } from "../../prothom-alo/InterviewContentScrapper";

describe("Prothom Alo Interview Scrapper", () => {
    let browser;
    let page;
    let scrapper;

    beforeAll(async () => {
        browser = await chromium.launch({ headless: true });
    });

    beforeEach(async () => {
        page = await browser.newPage();
    });

    test("should interview article proprly", async () => {
        scrapper = new InterviewContentScrapper(page);
        const urlToScrap = "https://www.prothomalo.com/opinion/interview/khludjm83o";
        const result = await scrapper.scrapContent(urlToScrap);

        expect(result).toHaveProperty("headline");
        expect(result).toHaveProperty("author");
        expect(result).toHaveProperty("content");

        expect(typeof result.headline).toBe("string");
        expect(typeof result.content).toBe("string");

        expect(result.headline.length).toBeGreaterThan(0);
        expect(result.content.length).toBeGreaterThan(0);
    }, 5 * 60000);

    afterEach(async () => {
        await page.close();
    });

    afterAll(async () => {
        await browser.close();
    });
});
