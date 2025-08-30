import { TIMEOUT } from "../config.js";

const interviewContentSelector = "#container .story-grid .story-content-wrapper .story-content .storyCard";

const titleSelector = "#container .story-grid h1";
const subTitleSelector = "#container .story-grid h2";

export class InterviewContentScrapper {
    constructor(page) {
        this.page = page;
    }

    async scrapHeadline() {
        const header = await this.page.$$eval(titleSelector, (headline) => {
            return headline && (headline[0]?.textContent?.trim() ?? false);
        });

        const subHeader = await this.page.$$eval(subTitleSelector, (headline) => {
            return headline && (headline[0]?.textContent?.trim() ?? false);
        });

        return `${subHeader ? subHeader : ""}\n${header ? header : ""}`;
    }

    async scrapContent(urlToScrap) {
        await this.page.goto(urlToScrap, { timeout: TIMEOUT });

        await this.page.waitForSelector(interviewContentSelector, { timeout: TIMEOUT });

        const headline = await this.scrapHeadline();

        const paragraphs = await this.page.$$eval(interviewContentSelector, (paras) => {
            return paras.map(text => text && (text?.textContent?.trim() ?? false));
        });

        const content = (headline ? `${headline}\n` : "") + paragraphs.join("\n");

        return {
            headline,
            author: "",
            content
        };
    }
}
