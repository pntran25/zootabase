const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');

// GET all feedback
router.get('/api/feedback', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM GuestFeedback ORDER BY DateSubmitted DESC');
        
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
        res.status(500).json({ error: 'Internal server error' });
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
            .query(`
                DECLARE @Out TABLE (FeedbackID INT);
                INSERT INTO GuestFeedback (Rating, Comment, LocationTag, DateSubmitted)
                OUTPUT INSERTED.FeedbackID INTO @Out
                VALUES (@rating, @comment, @location, @date);
                SELECT FeedbackID FROM @Out;
            `);
            
        res.status(201).json({ id: result.recordset[0].FeedbackID.toString(), ...req.body });
    } catch (error) {
        console.error('Error creating feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE feedback
router.delete('/api/feedback/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query('DELETE FROM GuestFeedback WHERE FeedbackID = @id');
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
