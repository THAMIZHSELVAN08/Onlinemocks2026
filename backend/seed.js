const db = require('./src/config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedData = async () => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Cleaning database...");
        await client.query('TRUNCATE users CASCADE');

        console.log("Seeding Admin...");
        const adminSalt = await bcrypt.genSalt(10);
        const adminHash = await bcrypt.hash("admin123", adminSalt);
        await client.query(
            "INSERT INTO users (id, username, password_hash, role) VALUES ($1, $2, $3, $4)",
            ['00000000-0000-0000-0000-000000000000', 'admin', adminHash, 'ADMIN']
        );

        console.log("Seeding HRs...");
        const hrNames = ["Rajesh Kumar", "Ananya Singh", "Suresh Raina", "Meera Nair", "Vikram Rathore"];
        const hrCompanies = ["TechCorp", "Innovate Solutions", "DataFlow Inc", "Global HR", "NexGen Systems"];
        const hrIds = [];

        for (let i = 0; i < hrNames.length; i++) {
            const username = `hr${i + 1}`;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("hr123", salt);

            const userRes = await client.query(
                "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'HR') RETURNING id",
                [username, hashedPassword]
            );
            const userId = userRes.rows[0].id;
            hrIds.push(userId);

            await client.query(
                "INSERT INTO hr_profiles (id, name, company_name) VALUES ($1, $2, $3)",
                [userId, hrNames[i], hrCompanies[i]]
            );
        }

        console.log("Seeding 50 Students...");
        const depts = ["CSE", "ECE", "EEE", "MECH", "IT", "BIO-TECH"];
        const sections = ["A", "B", "C"];

        for (let i = 1; i <= 50; i++) {
            const regNum = `2127230601${String(100 + i)}`;
            const name = `Student ${i}`;
            const username = regNum;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(regNum, salt);
            const dept = depts[Math.floor(Math.random() * depts.length)];
            const section = sections[Math.floor(Math.random() * sections.length)];
            const assignedHr = hrIds[Math.floor(Math.random() * hrIds.length)];

            const userRes = await client.query(
                "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'STUDENT') RETURNING id",
                [username, hashedPassword]
            );
            const userId = userRes.rows[0].id;

            await client.query(
                "INSERT INTO students (id, name, register_number, department, section, current_hr_id, aptitude_score, gd_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                [userId, name, regNum, dept, section, assignedHr, Math.floor(Math.random() * 50) + 40, Math.floor(Math.random() * 50) + 40]
            );
        }

        await client.query('COMMIT');
        console.log("Seeding completed successfully!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error seeding data:", err);
    } finally {
        client.release();
        process.exit();
    }
};

seedData();
