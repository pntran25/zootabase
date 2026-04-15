const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');
const Q = require('../queries/staffScheduleQueries');

// ── GET all staff schedules (joined with Staff + Exhibit) ───────────
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(Q.getAll);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching staff schedules:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── POST create staff schedule ──────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
    try {
        const { StaffID, WorkDate, ShiftStart, ShiftEnd, AssignedExhibitID } = req.body;
        if (!StaffID || !WorkDate || !ShiftStart || !ShiftEnd) {
            return res.status(400).json({ error: 'StaffID, WorkDate, ShiftStart, and ShiftEnd are required.' });
        }
        const pool = await connectToDb();
        const result = await pool.request()
            .input('staffId', sql.Int, parseInt(StaffID, 10))
            .input('workDate', sql.Date, WorkDate)
            .input('shiftStart', sql.VarChar(8), ShiftStart)
            .input('shiftEnd', sql.VarChar(8), ShiftEnd)
            .input('exhibitId', sql.Int, AssignedExhibitID ? parseInt(AssignedExhibitID, 10) : null)
            .input('createdBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(Q.insert);
        res.status(201).json({ ScheduleID: result.recordset[0].ScheduleID, ...req.body });
    } catch (error) {
        console.error('Error creating staff schedule:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── PUT update staff schedule ───────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { StaffID, WorkDate, ShiftStart, ShiftEnd, AssignedExhibitID } = req.body;
        if (!StaffID || !WorkDate || !ShiftStart || !ShiftEnd) {
            return res.status(400).json({ error: 'StaffID, WorkDate, ShiftStart, and ShiftEnd are required.' });
        }
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('staffId', sql.Int, parseInt(StaffID, 10))
            .input('workDate', sql.Date, WorkDate)
            .input('shiftStart', sql.VarChar(8), ShiftStart)
            .input('shiftEnd', sql.VarChar(8), ShiftEnd)
            .input('exhibitId', sql.Int, AssignedExhibitID ? parseInt(AssignedExhibitID, 10) : null)
            .input('updatedBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(Q.update);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating staff schedule:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── DELETE (soft delete) staff schedule ──────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query(Q.remove);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting staff schedule:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
