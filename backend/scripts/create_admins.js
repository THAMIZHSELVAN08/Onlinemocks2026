const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function createAdmins() {
    const salt = await bcrypt.genSalt(10);

    for (let i = 1; i <= 10; i++) {
        const username = `admin${i}`;
        const password = `adminPass${i}`;
        const password_hash = await bcrypt.hash(password, salt);

        try {
            await pool.query(
                'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
                [username, password_hash, 'ADMIN']
            );
            console.log(`Created: ${username} | Password: ${password}`);
        } catch (err) {
            console.error(`Error creating ${username}:`, err.message);
        }
    }
    await pool.end();
}

createAdmins();
