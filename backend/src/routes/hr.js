const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, checkRole } = require('../middleware/auth');

// @route   GET api/hr/students
// @desc    Get students assigned to this HR
router.get('/students', auth, checkRole(['HR']), async (req, res) => {
    try {
        const result = await db.query(
            `SELECT s.*, u.username, u.id as user_id,
                    CASE WHEN e.student_id IS NOT NULL THEN 'COMPLETED' ELSE 'INCOMPLETE' END as evaluation_status
             FROM students s 
             JOIN users u ON s.id = u.id 
             LEFT JOIN evaluations e ON s.id = e.student_id
             WHERE s.current_hr_id = $1`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/hr/student/:id
// @desc    Get detailed student info for evaluation
router.get('/student/:id', auth, checkRole(['HR']), async (req, res) => {
    try {
        const result = await db.query(
            `SELECT s.*, u.username, hp.name as hr_name, hp.company_name as hr_company
             FROM students s 
             JOIN users u ON s.id = u.id 
             JOIN hr_profiles hp ON s.current_hr_id = hp.id
             WHERE s.id = $1 AND s.current_hr_id = $2`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found or not assigned to you' });
        }

        const student = result.rows[0];
        student.current_date = new Date().toISOString().split('T')[0];

        res.json(student);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/hr/evaluate
// @desc    Submit detailed evaluation for a student
router.post('/evaluate', auth, checkRole(['HR']), async (req, res) => {
    const {
        studentId,
        criteria,
        strengths,
        improvements,
        comments,
        overallScore
    } = req.body;

    try {
        await db.query(
            `INSERT INTO evaluations (
                student_id, hr_id, appearance_attitude, managerial_aptitude, 
                general_awareness, technical_knowledge, communication_skills, 
                ambition, self_confidence, strengths, improvements, comments, 
                overall_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (student_id) DO UPDATE SET 
                appearance_attitude = EXCLUDED.appearance_attitude,
                managerial_aptitude = EXCLUDED.managerial_aptitude,
                general_awareness = EXCLUDED.general_awareness,
                technical_knowledge = EXCLUDED.technical_knowledge,
                communication_skills = EXCLUDED.communication_skills,
                ambition = EXCLUDED.ambition,
                self_confidence = EXCLUDED.self_confidence,
                strengths = EXCLUDED.strengths,
                improvements = EXCLUDED.improvements,
                comments = EXCLUDED.comments,
                overall_score = EXCLUDED.overall_score,
                evaluation_date = CURRENT_DATE`,
            [
                studentId, req.user.id,
                criteria.appearance_attitude, criteria.managerial_aptitude,
                criteria.general_awareness, criteria.technical_knowledge,
                criteria.communication_skills, criteria.ambition,
                criteria.self_confidence, strengths, improvements,
                comments, overallScore
            ]
        );

        res.json({ message: 'Evaluation submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
