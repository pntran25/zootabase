const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');
const Q = require('../queries/feedbackQueries');

// GET all feedback
router.get('/api/feedback', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(Q.getAll);
        
        const mappedResult = result.recordset.map(row => ({
            id: row.FeedbackID.toString(),
            rating: row.Rating,
            comment: row.Comment,
            location: row.LocationTag,
            date: row.DateSubmitted ? row.DateSubmitted.toISOString().split('T')[0] : ''
        }));
        
        res.json(mappedResult);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST new feedback
router.post('/api/feedback', async (req, res) => {
    try {
        const { rating, comment, location, date } = req.body;
        const pool = await connectToDb();
        
        const result = await pool.request()
            .input('rating', sql.Int, parseInt(rating, 10))
            .input('comment', sql.NVarChar, comment)
            .input('location', sql.NVarChar, location)
            .input('date', sql.Date, date)
            .query(Q.insert);
            
        res.status(201).json({ id: result.recordset[0].FeedbackID.toString(), ...req.body });
    } catch (error) {
        console.error('Error creating feedback:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE feedback
router.delete('/api/feedback/:id', verifyToken, async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query(Q.remove);
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
