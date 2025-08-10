import config from "../config.js";
import { ContentScrapper } from "./ContentScrapper.js";
import { InterviewContentScrapper } from "./InterviewContentScrapper.js";
import UrlRepository from "../db/UrlRepository.js";
import { UrlStatusEnum } from "../UrlStatusEnum.js";
const { tts } = config;
import crypto from 'crypto';
import { publish } from "../rabbitmq.js";
const timeout = config.timeout;
const sourceName = "prothom-alo";
const urlToScrap = "https://www.prothomalo.com/opinion";

const opinionStartLinksSelector = "#container .wide-story-card .headline-title a, #container .news_with_item .card-with-image-zoom a";
const opinionInfScrollLinksSelector = "#container div.content-area div.card-with-image-zoom a";
const moreOpinionBtnSelector = "#container .more .load-more-content";
const midPageScrollLocation = "#container div[data-infinite-scroll=\"2\"]";

export async function scrapProthomAlo(page) {
    console.log("Scrapping Prothom Alo");
    await page.goto(urlToScrap, { timeout });
    await page.waitForSelector(opinionStartLinksSelector, { timeout }); // what happens if timeout reached?

    const opinionStartLinks = await page.$$eval(opinionStartLinksSelector, (aTags) => {
        return aTags.map(aTag => aTag.href);
    });

    for (let link of opinionStartLinks) {
        const isUrlExists = await UrlRepository.isUrlExists(link, sourceName);
        if (!isUrlExists) {
            await UrlRepository.insertUrl({ url: link, source: sourceName, status: UrlStatusEnum.PENDING });
        } else {
            continue;
        }
    }

    await page.locator(midPageScrollLocation).scrollIntoViewIfNeeded();

    let infiniteScrollLinkCount = 0;
    let alreadyLoadedLinkCount = 0;
    while (infiniteScrollLinkCount < 5) {
        let opinionInfScrollLinks = await page.$$eval(opinionInfScrollLinksSelector, (aTags) => {
            return aTags.map(aTag => aTag.href);
        });

        let newlyLoadedLinks = opinionInfScrollLinks.slice(infiniteScrollLinkCount);
        for (let link of newlyLoadedLinks) {
            const isUrlExists = await UrlRepository.isUrlExists(link, sourceName);
            if (!isUrlExists) {
                await UrlRepository.insertUrl({ url: link, source: sourceName, status: UrlStatusEnum.PENDING });
            } else {
                alreadyLoadedLinkCount++;
                if (alreadyLoadedLinkCount >= 5) {
                    break;
                }
            }
        }

        if (alreadyLoadedLinkCount >= 5) {
            console.log("Already loaded 5 links, stopping infinite scroll");
            break;
        }

        infiniteScrollLinkCount += newlyLoadedLinks.length;
        await page.locator(moreOpinionBtnSelector).click({ timeout });
    }

    return await scrapOpinions(page);
}

async function scrapOpinions(page) {
    let links = await UrlRepository.getPendingUrls(sourceName);
    if (links.length === 0) {
        console.log("No pending links to scrap");
        return [];
    }

    let scrappedOpnions = [];
    for (let { url: link, data: article} of links) {
        console.log("Processing link:", link);
        try {
            if (!article) {
                let scrapper = null;
                if (link.includes('/interview/')) {
                    scrapper = new InterviewContentScrapper(page);
                } else {
                    scrapper = new ContentScrapper(page);
                }

                article = await scrapper.scrapContent(link);
                scrappedOpnions.push(article);
            }

            await UrlRepository.updateUrl(link, sourceName, UrlStatusEnum.PREPARING_AUDIO, article);

            const id = crypto.randomUUID();
            await publish(tts.inputRoutingKey, { ...article, id });
            console.log(`Sent: ${article.headline} (${id})`);

            //make the url complete after getting audio
        } catch (e) {
            console.log(e.message, link);
            await UrlRepository.updateUrl(link, sourceName, UrlStatusEnum.FAILED);
        }
    }

    return scrappedOpnions;
}
