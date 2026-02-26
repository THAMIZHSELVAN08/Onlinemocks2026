const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const runInit = async () => {
    const client = await db.pool.connect();
    try {
        const sqlPath = path.join(__dirname, 'scripts', 'init-db.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Initializing database schema...");
        await client.query(sql);
        console.log("Schema initialized successfully!");
    } catch (err) {
        console.error("Error initializing database:", err);
    } finally {
        client.release();
        process.exit();
    }
};

runInit();
