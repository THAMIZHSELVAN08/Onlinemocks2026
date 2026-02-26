const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, checkRole } = require('../middleware/auth');

// @route   POST api/student/check-in
// @desc    Mark attendance when starting exam
router.post('/check-in', auth, checkRole(['STUDENT']), async (req, res) => {
    const { deviceInfo } = req.body;
    const ipAddress = req.ip;

    try {
        await db.query(
            "INSERT INTO attendance (student_id, ip_address, device_info) VALUES ($1, $2, $3)",
            [req.user.id, ipAddress, deviceInfo]
        );
        res.json({ message: 'Attendance marked successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/student/profile
// @desc    Get student profile including resume_url
router.get('/profile', auth, checkRole(['STUDENT']), async (req, res) => {
    try {
        const result = await db.query(
            "SELECT s.*, u.username FROM students s JOIN users u ON s.id = u.id WHERE s.id = $1",
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
