import { MongoClient } from 'mongodb';
import { DATABASE_URL } from '../config.js';

const dbName = 'scrapper_db';

let db = null;

export async function connect() {
    if (db) return db;
    const client = new MongoClient(DATABASE_URL, { useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    return db;
}
