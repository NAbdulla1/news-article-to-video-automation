import { MongoClient } from 'mongodb';

import config from '../config.js';
const { databaseUrl } = config;

const uri = databaseUrl;
const dbName = 'scrapper_db';

let db = null;

export async function connect() {
    if (db) return db;
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    return db;
}
