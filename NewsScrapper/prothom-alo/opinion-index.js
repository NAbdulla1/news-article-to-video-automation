import { TIMEOUT, TTS_INPUT_ROUTING_KEY } from "../config.js";
import { ContentScrapper } from "./ContentScrapper.js";
import { InterviewContentScrapper } from "./InterviewContentScrapper.js";
import UrlRepository from "../db/UrlRepository.js";
import { UrlStatusEnum } from "../UrlStatusEnum.js";
import crypto from 'crypto';
import { publish } from "../infra/rabbitmq.js";
import logger from '../logger.js';
const sourceName = "prothom-alo";
const urlToScrap = "https://www.prothomalo.com/opinion";

const opinionStartLinksSelector = "#container .wide-story-card .headline-title a, #container .news_with_item .card-with-image-zoom a";
const opinionInfScrollLinksSelector = "#container div.content-area div.card-with-image-zoom a";
const moreOpinionBtnSelector = "#container .more .load-more-content";
const midPageScrollLocation = "#container div[data-infinite-scroll=\"2\"]";

export async function scrapProthomAlo(page) {
    logger.info("Scrapping Prothom Alo");
    await page.goto(urlToScrap, { timeout: TIMEOUT });
    await page.waitForSelector(opinionStartLinksSelector, { timeout: TIMEOUT }); // what happens if timeout reached?

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
            logger.info("Already loaded 5 links, stopping infinite scroll");
            break;
        }

        infiniteScrollLinkCount += newlyLoadedLinks.length;
        await page.locator(moreOpinionBtnSelector).click({ timeout: TIMEOUT });
    }

    return await scrapOpinions(page);
}

async function scrapOpinions(page) {
    let links = await UrlRepository.getPendingUrls(sourceName);
    if (links.length === 0) {
        logger.info("No pending links to scrap");
        return [];
    }

    let scrappedOpnions = [];
    for (let { url: link, data: article} of links) {
        article = await processArticleLink(link, article, page, scrappedOpnions);
        const id = await publishArticle(article);
        logger.info(`Published: ${article.headline} (${id})`);
    }

    return scrappedOpnions;
}

export function getScrapper(link, page) {
    if (link.includes('/interview/')) {
        return new InterviewContentScrapper(page);
    } else {
        return new ContentScrapper(page);
    }
}

export async function scrapArticle(link, article, page) {
    if (article) return article;
    const scrapper = getScrapper(link, page);
    return await scrapper.scrapContent(link);
}

export async function updateArticleStatus(link, article, status) {
    await UrlRepository.updateUrl(link, sourceName, status, article);
}

export async function publishArticle(article) {
    const id = crypto.randomUUID();
    await publish(TTS_INPUT_ROUTING_KEY, { ...article, id });
    return id;
}

export async function processArticleLink(link, article, page, scrappedOpnions) {
    logger.info("Processing link:", link);
    try {
        article = await scrapArticle(link, article, page);
        scrappedOpnions.push(article);
        await updateArticleStatus(link, article, UrlStatusEnum.COMPLETED);
    } catch (e) {
        logger.error(e, link);
        await updateArticleStatus(link, article, UrlStatusEnum.FAILED);
    }
    return article;
}
