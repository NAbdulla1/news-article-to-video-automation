import { timeout } from "../config.js";
import { ContentScrapper } from "./ContentScrapper.js";
import { InterviewContentScrapper } from "./InterviewContentScrapper.js";

const urlToScrap = "https://www.prothomalo.com/opinion";

const opinionStartLinksSelector = "#container .wide-story-card .headline-title a, #container .news_with_item .card-with-image-zoom a";
const opinionInfScrollLinksSelector = "#container div.content-area div.card-with-image-zoom a";
const moreOpinionBtnSelector = "#container .more .load-more-content";
const midPageScrollLocation = "#container div[data-infinite-scroll=\"2\"]";

export async function scrapProthomAlo(page) {
    console.log("Scrapping Prothom Alo");
    const lastScrappedOpinionUrl = 'ASDFASDFASD';//TODO this will come from DB or other source

    await page.goto(urlToScrap, { timeout });
    await page.waitForSelector(opinionStartLinksSelector, { timeout }); // what happens if timeout reached?

    const opinionStartLinks = await page.$$eval(opinionStartLinksSelector, (aTags) => {
        return aTags.map(aTag => aTag.href);
    });

    let existingIndex = opinionStartLinks.findIndex(link => link.includes(lastScrappedOpinionUrl));
    if (existingIndex !== -1) {
        return await scrapOpinions(page, opinionStartLinks.slice(0, existingIndex));
    }
    await page.locator(midPageScrollLocation).scrollIntoViewIfNeeded();

    let allOpinionInfScrollLinks = [...opinionStartLinks];
    while (allOpinionInfScrollLinks.filter(link => link.includes(lastScrappedOpinionUrl)).length === 0
        && allOpinionInfScrollLinks.length < 5) { //TODO remove this constraint if lastScrappedOptionUrl is there
        let opinionInfScrollLinks = await page.$$eval(opinionInfScrollLinksSelector, (aTags) => {
            return aTags.map(aTag => aTag.href);
        });

        console.log('inf scroll links:', opinionInfScrollLinks.length);
        let newlyLoadedLinks = opinionInfScrollLinks.slice(allOpinionInfScrollLinks.length);
        allOpinionInfScrollLinks.push(...newlyLoadedLinks);
        await page.locator(moreOpinionBtnSelector).click({ timeout });
        console.log("New data loaded...");
    }

    existingIndex = allOpinionInfScrollLinks.findIndex(link => link.includes(lastScrappedOpinionUrl));
    if (existingIndex !== -1) {
        allOpinionInfScrollLinks = allOpinionInfScrollLinks.slice(0, existingIndex);
    }

    return await scrapOpinions(page, opinionStartLinks.concat(allOpinionInfScrollLinks));
}

async function scrapOpinions(page, links = []) {
    let scrappedOpnions = [];
    for (let link of links) {
        console.log("Processing link:", link);
        try {
            let scrapper = null;
            if (link.includes('/interview/')) {
                scrapper = new InterviewContentScrapper(page);
            } else {
                scrapper = new ContentScrapper(page);
            }

            const op = await scrapper.scrapContent(link);
            scrappedOpnions.push(op);
        } catch (e) {
            console.log(e.message, link);
        }
    }

    return scrappedOpnions;
}
