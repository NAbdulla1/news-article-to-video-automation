import { connect } from './index.js';
import { UrlStatusEnum } from '../UrlStatusEnum.js';

class UrlRepository {
    constructor(db) {
        this.collection = db.collection('urls');
    }

    async insertUrl({ url, source, status }) {
        const result = await this.collection.insertOne({ url, source, status, data: null });
        return result;
    }

    async isUrlExists(url, source) {
        const result = await this.collection.findOne({ url, source });
        return result;
    }

    async getPendingUrls(source) {
        const result = await this.collection.find({ source, status: UrlStatusEnum.PENDING }).toArray();
        return result;
    }

    async updateUrl(url, source, status, scrappedData = null) {
        const updateData = { status };
        if (scrappedData) {
            updateData.data = scrappedData;
        }
        const result = await this.collection.updateOne({ url, source }, { $set: updateData });
        return result;
    }

    async getNonCompletedUrls() {
        return await this.collection.find({ status: { $ne: UrlStatusEnum.COMPLETED } }).toArray();
    }
}

export default new UrlRepository(await connect());
