const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, checkRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');

// Multi-upload config for Resumes
const resumeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resumes/');
    },
    filename: (req, file, cb) => {
        // File name must be reg_number.pdf as per requirement
        cb(null, file.originalname);
    }
});
const uploadResumes = multer({ storage: resumeStorage });

// CSV config for Bulk Students
const uploadCsv = multer({ dest: 'uploads/temp/' });

// @route   GET api/admin/stats
// @desc    Get system statistics for admin dashboard
router.get('/stats', auth, checkRole(['ADMIN']), async (req, res) => {
    try {
        const studentCount = await db.query('SELECT COUNT(*) FROM students');
        const hrCount = await db.query('SELECT COUNT(*) FROM hr_profiles');
        const volunteerCount = await db.query('SELECT COUNT(*) FROM volunteer_profiles');

        res.json({
            students: parseInt(studentCount.rows[0].count),
            hrs: parseInt(hrCount.rows[0].count),
            volunteers: parseInt(volunteerCount.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/students/all
// @desc    Get all students with evaluation status and HR details
router.get('/students/all', auth, checkRole(['ADMIN']), async (req, res) => {
    try {
        const result = await db.query(
            `SELECT s.*, 
                    CASE WHEN e.student_id IS NOT NULL THEN 'COMPLETED' ELSE 'INCOMPLETE' END as evaluation_status,
                    hp.name as hr_name,
                    hp.company_name as hr_company
             FROM students s 
             LEFT JOIN evaluations e ON s.id = e.student_id
             LEFT JOIN hr_profiles hp ON s.current_hr_id = hp.id
             ORDER BY s.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/students
// @desc    Search students by register number
router.get('/students', auth, checkRole(['ADMIN']), async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);

    try {
        // Split by comma or space and trim to support bulk search
        const terms = query.split(/[\s,]+/).filter(t => t.length > 0);

        let result;
        if (terms.length > 1) {
            // Bulk search by exact register numbers (pattern: 2127230601090)
            result = await db.query(
                `SELECT s.*, u.username, hp.name as hr_name 
                 FROM students s 
                 JOIN users u ON s.id = u.id 
                 LEFT JOIN hr_profiles hp ON s.current_hr_id = hp.id
                 WHERE s.register_number = ANY($1)`,
                [terms]
            );
        } else {
            // Single term search using ILIKE for partial matches
            result = await db.query(
                `SELECT s.*, u.username, hp.name as hr_name 
                 FROM students s 
                 JOIN users u ON s.id = u.id 
                 LEFT JOIN hr_profiles hp ON s.current_hr_id = hp.id
                 WHERE s.register_number ILIKE $1 OR s.name ILIKE $1`,
                [`%${query}%`]
            );
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/hrs
// @desc    Get all HRs with extended info (username, volunteers)
router.get('/hrs', auth, checkRole(['ADMIN']), async (req, res) => {
    try {
        const result = await db.query(
            `SELECT hp.*, u.username, 
             (SELECT COUNT(*) FROM volunteer_profiles vp WHERE vp.assigned_hr_id = hp.id) as volunteer_count,
             (SELECT STRING_AGG(vp.name, ', ') FROM volunteer_profiles vp WHERE vp.assigned_hr_id = hp.id) as volunteers,
             (SELECT COUNT(*) FROM students s WHERE s.current_hr_id = hp.id) as total_students,
             (SELECT COUNT(*) FROM students s JOIN evaluations e ON s.id = e.student_id WHERE s.current_hr_id = hp.id) as completed_students
             FROM hr_profiles hp
             JOIN users u ON hp.id = u.id
             ORDER BY hp.name`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/hrs/:hrId/students
// @desc    Get all students assigned to a specific HR
router.get('/hrs/:hrId/students', auth, checkRole(['ADMIN']), async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM students WHERE current_hr_id = $1 ORDER BY name',
            [req.params.hrId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/volunteers
// @desc    Get all volunteers with assigned HR info
router.get('/volunteers', auth, checkRole(['ADMIN']), async (req, res) => {
    try {
        const result = await db.query(
            `SELECT vp.*, u.username, hp.name as hr_name, hp.company_name as hr_company
             FROM volunteer_profiles vp
             JOIN users u ON vp.id = u.id
             LEFT JOIN hr_profiles hp ON vp.assigned_hr_id = hp.id
             ORDER BY vp.name`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/admin/students/transfer
// @desc    Bulk transfer students to another HR
router.post('/students/transfer', auth, checkRole(['ADMIN']), async (req, res) => {
    const { studentIds, targetHrId, reason } = req.body;
    const adminId = req.user.id;

    if (!studentIds || !targetHrId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        for (const sid of studentIds) {
            // Get original HR
            const oldHrResult = await client.query('SELECT current_hr_id FROM students WHERE id = $1', [sid]);
            const oldHrId = oldHrResult.rows[0]?.current_hr_id;

            // Log the transfer
            await client.query(
                'INSERT INTO student_transfers (student_id, from_hr_id, to_hr_id, admin_id, transfer_reason) VALUES ($1, $2, $3, $4, $5)',
                [sid, oldHrId, targetHrId, adminId, reason]
            );
        }

        // Bulk update student HR allocation
        await client.query(
            'UPDATE students SET current_hr_id = $1 WHERE id = ANY($2)',
            [targetHrId, studentIds]
        );

        // Create notification for target HR
        await client.query(
            'INSERT INTO notifications (receiver_id, message, type) VALUES ($1, $2, $3)',
            [targetHrId, `${studentIds.length} students have been transferred to you.`, 'TRANSFER']
        );

        await client.query('COMMIT');

        // Socket notification (handled in index.js via io)
        const io = req.app.get('socketio');
        io.to(targetHrId).emit('NOTIFICATION', {
            message: `${studentIds.length} students transferred to you.`,
            type: 'TRANSFER'
        });

        res.json({ message: 'Transfer successful' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
});

// @route   POST api/admin/resumes/bulk
// @desc    Bulk upload student resumes (Files named as reg_number.pdf)
router.post('/resumes/bulk', auth, checkRole(['ADMIN']), uploadResumes.array('files'), async (req, res) => {
    try {
        const files = req.files;
        for (const file of files) {
            const registerNumber = path.parse(file.originalname).name;
            await db.query(
                "UPDATE students SET resume_url = $1 WHERE register_number = $2",
                [`/uploads/resumes/${file.originalname}`, registerNumber]
            );
        }
        res.json({ message: `${files.length} resumes uploaded and linked successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/admin/students/bulk
// @desc    Bulk register students via CSV
router.post('/students/bulk', auth, checkRole(['ADMIN']), uploadCsv.single('file'), async (req, res) => {
    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            const client = await db.pool.connect();
            try {
                await client.query('BEGIN');
                for (const row of results) {
                    const regNum = row.register_number || row.username;
                    const { name, department, section } = row;
                    if (!regNum) continue;

                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(regNum, salt);

                    // Insert or update User
                    const userRes = await client.query(
                        `INSERT INTO users (username, password_hash, role) 
                         VALUES ($1, $2, 'STUDENT') 
                         ON CONFLICT (username) DO UPDATE SET role = 'STUDENT'
                         RETURNING id`,
                        [regNum, hashedPassword]
                    );
                    const userId = userRes.rows[0].id;

                    // Insert or update Student
                    await client.query(
                        `INSERT INTO students (id, name, register_number, department, section) 
                         VALUES ($1, $2, $3, $4, $5) 
                         ON CONFLICT (register_number) DO UPDATE SET 
                            name = EXCLUDED.name, 
                            department = EXCLUDED.department, 
                            section = EXCLUDED.section`,
                        [userId, name, regNum, department, section]
                    );
                }
                await client.query('COMMIT');
                fs.unlinkSync(req.file.path);
                res.json({ message: `${results.length} students registered successfully` });
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(err);
                res.status(500).send('Server Error');
            } finally {
                client.release();
            }
        });
});

// @route   POST api/admin/register/hr
// @desc    Register a new HR
router.post('/register/hr', auth, checkRole(['ADMIN']), async (req, res) => {
    const { username, password, name, company_name } = req.body;

    try {
        const userExists = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const newUser = await client.query(
                'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
                [username, password_hash, 'HR']
            );

            await client.query(
                'INSERT INTO hr_profiles (id, name, company_name, plain_password) VALUES ($1, $2, $3, $4)',
                [newUser.rows[0].id, name, company_name, password]
            );

            await client.query('COMMIT');
            res.json({ message: 'HR Registered Successfully' });
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

// @route   POST api/admin/register/volunteer
// @desc    Register a new Volunteer
router.post('/register/volunteer', auth, checkRole(['ADMIN']), async (req, res) => {
    const { username, password, name, hrId } = req.body;

    try {
        const userExists = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const newUser = await client.query(
                'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
                [username, password_hash, 'VOLUNTEER']
            );

            await client.query(
                'INSERT INTO volunteer_profiles (id, name, assigned_hr_id, plain_password) VALUES ($1, $2, $3, $4)',
                [newUser.rows[0].id, name, hrId, password]
            );

            await client.query('COMMIT');
            res.json({ message: 'Volunteer Registered Successfully' });
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
