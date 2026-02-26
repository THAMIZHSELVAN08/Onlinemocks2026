const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// @route   POST api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
    const { username, password, role, name, company_name } = req.body;

    try {
        const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Start Transaction
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const newUser = await client.query(
                'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
                [username, password_hash, role]
            );

            const userId = newUser.rows[0].id;

            if (role === 'HR') {
                await client.query(
                    'INSERT INTO hr_profiles (id, name, company_name, plain_password) VALUES ($1, $2, $3, $4)',
                    [userId, name, company_name, password]
                );
            } else if (role === 'VOLUNTEER') {
                const { assignedHrId } = req.body;
                await client.query(
                    'INSERT INTO volunteer_profiles (id, name, assigned_hr_id, plain_password) VALUES ($1, $2, $3, $4)',
                    [userId, name, assignedHrId, password]
                );
            } else if (role === 'STUDENT') {
                await client.query(
                    'INSERT INTO students (id, name, register_number) VALUES ($1, $2, $3)',
                    [userId, name, username]
                );
            }

            await client.query('COMMIT');

            const token = jwt.sign(
                { id: userId, username: newUser.rows[0].username, role: newUser.rows[0].role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({ token, user: newUser.rows[0] });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user is Hardcoded Admin
        if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { id: '00000000-0000-0000-0000-000000000000', username: 'admin', role: 'ADMIN' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            return res.json({ token, user: { id: '00000000-0000-0000-0000-000000000000', username: 'admin', role: 'ADMIN' } });
        }

        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
