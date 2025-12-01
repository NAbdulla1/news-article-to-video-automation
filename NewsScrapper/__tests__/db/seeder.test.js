
import { MongoMemoryServer } from "mongodb-memory-server";
import { NewsSourceEnum } from "../../SourceEnum.js";

let mockDATABASE_URL;
jest.mock('../../config.js', () => ({
    DATABASE_URL: mockDATABASE_URL,
    TIMEOUT: "30000"
}));

let mongod;
let seeder;
let urlRepository;

describe("Seed database properly", () => {
    beforeAll(async () => {
        // start in-memory MongoDB
        mongod = await MongoMemoryServer.create();

        // set mocked DATABASE_URL dynamically
        mockDATABASE_URL = mongod.getUri();

        // now import the module, we are importing it after ensuring that the DATABASE_URL is set from in-memory mongodb server
        seeder = await import("../../db/seeder.js");
        await seeder.seedDatabase();
        urlRepository = await import("../../db/UrlRepository.js");
        jest.resetModules();
    }, 30 * 1000); // the timeout is neccessary for downloading the mongodb-memory-server

    test("the database should have pending urls", async () => {
        const urls = await urlRepository.default.getPendingUrls(NewsSourceEnum.PROTHOM_ALO);
        expect(urls.length).toBeGreaterThan(0);
    }, 30 * 1000);

    afterAll(async () => {
        await mongod?.stop();
    });
});
