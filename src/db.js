import { MongoClient } from "mongodb";
import config from "./config.js";

const db_client = new MongoClient(config.mongo_uri);
const db = db_client.db();
db.client = db_client;

await db_client.connect();

db.init = async function (name) {
    if (!db.collection(name)) await db.createCollection(name);
    db[name] = db.collection(name);
};

export default db;
