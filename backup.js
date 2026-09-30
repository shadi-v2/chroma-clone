const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb+srv://devchroma:dev%40chroma@chromadiaries.6quioev.mongodb.net/chromadiaries-website?retryWrites=true&w=majority';
const dbName = 'chromadiaries-website';
const outputDir = path.join(__dirname, 'mongo_backup');

async function run() {
    // Ensure backup directory exists
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const client = new MongoClient(uri);
    try {
        console.log("Connecting to MongoDB Atlas...");
        await client.connect();
        console.log("Connected successfully!");

        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();

        for (let col of collections) {
            console.log(`Fetching data from: ${col.name}...`);
            const data = await db.collection(col.name).find({}).toArray();
            
            const filePath = path.join(outputDir, `${col.name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Successfully downloaded: ${col.name}.json`);
        }

        console.log("\n All collections backed up successfully in the 'mongo_backup' folder!");
    } catch (error) {
        console.error("Backup failed:", error);
    } finally {
        await client.close();
    }
}

run();