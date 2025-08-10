import config from "../config.js";
const { timeout } = config;

const contentSelector = "#container .story-grid .story-content-wrapper .story-content .story-element .story-element-text p";

const inContentTitleSelector = "#container .story-grid .story-content-wrapper .story-content .story-element .story-element-title";
const selector = `${contentSelector}, ${inContentTitleSelector}`;

const headlineSelector = "#container .story-grid .story-title-info h1";

const authorSelector = "#container .story-grid .story-metadata-wrapper .author-name-location-wrapper";

export class ContentScrapper {
    constructor(page) {
        this.page = page;
    }

    async scrapContent(urlToScrap) {
        await this.page.goto(urlToScrap, { timeout });

        await this.page.waitForSelector(contentSelector, { timeout });

        const headline = await this.page.$$eval(headlineSelector, (headline) => {
            return headline && (headline[0]?.textContent?.trim() ?? false);
        });

        const author = await this.page.$$eval(authorSelector, (authorInfo) => {
            return authorInfo && (authorInfo[0]?.textContent?.trim() ?? false);
        });

        const paragraphAndTitles = await this.page.$$eval(selector, (paragraphs) => {
            return paragraphs.map(text => text && (text?.textContent?.trim() ?? false));
        });

        const content = paragraphAndTitles.join("\n");

        return {
            headline,
            author,
            content
        };
    }
}
