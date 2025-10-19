import { connect } from './index.js';
import { UrlStatusEnum } from '../UrlStatusEnum.js';

class UrlRepository {
    constructor() {
        this.collection = null;
    }

    async initCollection() {
        if(this.collection) return;
        this.collection = (await connect()).collection('urls');
    }

    async insertUrl({ url, source, status }) {
        await this.initCollection();
        const result = await this.collection.insertOne({ url, source, status, data: null });
        return result;
    }

    async isUrlExists(url, source) {
        await this.initCollection();
        const result = await this.collection.findOne({ url, source });
        return result;
    }

    async getPendingUrls(source) {
        await this.initCollection();
        const result = await this.collection.find({ source, status: UrlStatusEnum.PENDING }).toArray();
        return result;
    }

    async findUrls({ status, source, page = 1, limit = 10 } = {}) {
        await this.initCollection();
        const filter = {};
        if (source) filter.source = source;
        if (status) filter.status = status;

        const skip = Math.max(0, (Number(page) - 1)) * Number(limit);
        const cursor = this.collection.find(filter).skip(skip).limit(Number(limit));
        const items = await cursor.toArray();
        const total = await this.collection.countDocuments(filter);
        return { items, total };
    }

    async updateUrl(url, source, status, scrappedData = null) {
        await this.initCollection();
        const updateData = { status };
        if (scrappedData) {
            updateData.data = scrappedData;
        }
        const result = await this.collection.updateOne({ url, source }, { $set: updateData });
        return result;
    }

    async getNonCompletedUrls() {
        await this.initCollection();
        return await this.collection.find({ status: { $ne: UrlStatusEnum.COMPLETED } }).toArray();
    }
}

export default new UrlRepository();
