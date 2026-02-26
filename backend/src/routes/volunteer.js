const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { auth, checkRole } = require('../middleware/auth');

// @route   GET api/volunteer/students
// @desc    Get students assigned to the volunteer's HR
router.get('/students', auth, checkRole(['VOLUNTEER']), async (req, res) => {
    try {
        // Get volunteer's HR ID
        const volunteerRes = await db.query('SELECT assigned_hr_id FROM volunteer_profiles WHERE id = $1', [req.user.id]);
        if (volunteerRes.rows.length === 0 || !volunteerRes.rows[0].assigned_hr_id) {
            return res.status(403).json({ message: 'No HR assigned to this volunteer' });
        }
        const hrId = volunteerRes.rows[0].assigned_hr_id;

        const result = await db.query(
            `SELECT s.*, 
                    CASE WHEN e.student_id IS NOT NULL THEN 'COMPLETED' ELSE 'INCOMPLETE' END as evaluation_status
             FROM students s 
             LEFT JOIN evaluations e ON s.id = e.student_id
             WHERE s.current_hr_id = $1`,
            [hrId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/volunteer/student
// @desc    Add a new student assigned to the same HR
router.post('/student', auth, checkRole(['VOLUNTEER']), async (req, res) => {
    const { name, register_number, department, section } = req.body;

    try {
        // Get volunteer's HR ID
        const volunteerRes = await db.query('SELECT assigned_hr_id FROM volunteer_profiles WHERE id = $1', [req.user.id]);
        if (volunteerRes.rows.length === 0 || !volunteerRes.rows[0].assigned_hr_id) {
            return res.status(403).json({ message: 'No HR assigned to this volunteer' });
        }
        const hrId = volunteerRes.rows[0].assigned_hr_id;

        // Check if user already exists
        const userCheck = await db.query('SELECT * FROM users WHERE username = $1', [register_number]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Student already exists' });
        }

        // Create student user
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(register_number, salt);

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const newUser = await client.query(
                'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
                [register_number, password_hash, 'STUDENT']
            );
            const studentId = newUser.rows[0].id;

            await client.query(
                'INSERT INTO students (id, name, register_number, department, section, current_hr_id) VALUES ($1, $2, $3, $4, $5, $6)',
                [studentId, name, register_number, department, section, hrId]
            );

            await client.query('COMMIT');
            res.json({ message: 'Student added successfully' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
