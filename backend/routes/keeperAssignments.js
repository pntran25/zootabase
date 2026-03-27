const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');

// ── GET all keeper assignments (joined with Animal + Staff) ─────────
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT ka.AssignmentID, ka.AnimalID, ka.StaffID, ka.StartDate, ka.EndDate,
                   ka.CreatedAt, ka.CreatedBy, ka.UpdatedAt, ka.UpdatedBy,
                   a.Name AS AnimalName, a.Species,
                   s.FullName AS KeeperName, s.Role AS KeeperRole
            FROM AnimalKeeperAssignment ka
            JOIN Animal a ON ka.AnimalID = a.AnimalID
            JOIN Staff s ON ka.StaffID = s.StaffID
            WHERE ka.DeletedAt IS NULL AND a.DeletedAt IS NULL AND s.DeletedAt IS NULL
            ORDER BY ka.StartDate DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching keeper assignments:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── GET keeper assignments for a specific animal ────────────────────
router.get('/animal/:animalId', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('animalId', sql.Int, parseInt(req.params.animalId, 10))
            .query(`
                SELECT ka.AssignmentID, ka.AnimalID, ka.StaffID, ka.StartDate, ka.EndDate,
                       s.FullName AS KeeperName, s.Role AS KeeperRole
                FROM AnimalKeeperAssignment ka
                JOIN Staff s ON ka.StaffID = s.StaffID
                WHERE ka.AnimalID = @animalId AND ka.DeletedAt IS NULL AND s.DeletedAt IS NULL
                ORDER BY ka.StartDate DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching keeper assignments for animal:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── POST create keeper assignment ───────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
    try {
        const { AnimalID, StaffID, StartDate, EndDate } = req.body;
        if (!AnimalID || !StaffID || !StartDate) {
            return res.status(400).json({ error: 'AnimalID, StaffID, and StartDate are required.' });
        }
        if (EndDate && new Date(EndDate) < new Date(StartDate)) {
            return res.status(400).json({ error: 'EndDate cannot be before StartDate.' });
        }
        const pool = await connectToDb();
        const result = await pool.request()
            .input('animalId', sql.Int, parseInt(AnimalID, 10))
            .input('staffId', sql.Int, parseInt(StaffID, 10))
            .input('startDate', sql.Date, new Date(StartDate))
            .input('endDate', sql.Date, EndDate ? new Date(EndDate) : null)
            .input('createdBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`
                INSERT INTO AnimalKeeperAssignment (AnimalID, StaffID, StartDate, EndDate, CreatedAt, CreatedBy)
                OUTPUT INSERTED.AssignmentID
                VALUES (@animalId, @staffId, @startDate, @endDate, SYSUTCDATETIME(), @createdBy)
            `);
        res.status(201).json({ AssignmentID: result.recordset[0].AssignmentID, ...req.body });
    } catch (error) {
        console.error('Error creating keeper assignment:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── PUT update keeper assignment ────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { AnimalID, StaffID, StartDate, EndDate } = req.body;
        if (!AnimalID || !StaffID || !StartDate) {
            return res.status(400).json({ error: 'AnimalID, StaffID, and StartDate are required.' });
        }
        if (EndDate && new Date(EndDate) < new Date(StartDate)) {
            return res.status(400).json({ error: 'EndDate cannot be before StartDate.' });
        }
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('animalId', sql.Int, parseInt(AnimalID, 10))
            .input('staffId', sql.Int, parseInt(StaffID, 10))
            .input('startDate', sql.Date, new Date(StartDate))
            .input('endDate', sql.Date, EndDate ? new Date(EndDate) : null)
            .input('updatedBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`
                UPDATE AnimalKeeperAssignment
                SET AnimalID = @animalId, StaffID = @staffId, StartDate = @startDate,
                    EndDate = @endDate, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
                WHERE AssignmentID = @id AND DeletedAt IS NULL
            `);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating keeper assignment:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── DELETE (soft) keeper assignment ─────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('deletedBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`UPDATE AnimalKeeperAssignment SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE AssignmentID = @id`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting keeper assignment:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
