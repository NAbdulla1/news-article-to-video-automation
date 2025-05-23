import { MongoClient } from 'mongodb';

import { databaseUrl } from '../config.js';

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
