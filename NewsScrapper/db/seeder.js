// seed the database with the following data using the UrlRepository
import UrlRepository from "./UrlRepository.js";
import { UrlStatusEnum } from "../UrlStatusEnum.js";
import { NewsSourceEnum } from "../SourceEnum.js";

// seed the database with 5 articles to stop the scrapper early
export async function seedDatabase() {
    const urlsToSeed = [
        { url: "https://www.prothomalo.com/opinion/column/sytkxzn1nc", source: NewsSourceEnum.PROTHOM_ALO, status: UrlStatusEnum.PENDING },
        { url: "https://www.prothomalo.com/politics/e8urqq2v2c", source: NewsSourceEnum.PROTHOM_ALO, status: UrlStatusEnum.PENDING },
        { url: "https://www.prothomalo.com/opinion/editorial/enhxj0muxz", source: NewsSourceEnum.PROTHOM_ALO, status: UrlStatusEnum.PENDING },
        { url: "https://www.prothomalo.com/opinion/editorial/7calc6iv8g", source: NewsSourceEnum.PROTHOM_ALO, status: UrlStatusEnum.PENDING },
        { url: "https://www.prothomalo.com/opinion/column/hbq45ddfc9", source: NewsSourceEnum.PROTHOM_ALO, status: UrlStatusEnum.PENDING },
    ];

    for (const urlData of urlsToSeed) {
        const exists = await UrlRepository.isUrlExists(urlData.url, urlData.source);
        if (!exists) {
            await UrlRepository.insertUrl(urlData);
        }
    }
}

seedDatabase().then(() => {
    console.log("Database seeding completed.");
}).catch((err) => {
    console.error("Error during database seeding:", err);
});
