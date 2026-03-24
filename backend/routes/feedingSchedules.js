const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');

// ── GET all feeding schedules (joined with Animal + Staff) ──────────
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT fs.ScheduleID, fs.AnimalID, fs.FeedTime, fs.FoodType, fs.StaffID,
                   fs.CreatedAt, fs.CreatedBy, fs.UpdatedAt, fs.UpdatedBy,
                   a.Name AS AnimalName, a.Species,
                   s.FullName AS StaffName, s.Role AS StaffRole
            FROM FeedingSchedule fs
            JOIN Animal a ON fs.AnimalID = a.AnimalID
            LEFT JOIN Staff s ON fs.StaffID = s.StaffID
            WHERE fs.DeletedAt IS NULL AND a.DeletedAt IS NULL
            ORDER BY fs.FeedTime
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching feeding schedules:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── GET feeding schedules for a specific animal ─────────────────────
router.get('/animal/:animalId', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('animalId', sql.Int, parseInt(req.params.animalId, 10))
            .query(`
                SELECT fs.ScheduleID, fs.AnimalID, fs.FeedTime, fs.FoodType, fs.StaffID,
                       s.FullName AS StaffName, s.Role AS StaffRole
                FROM FeedingSchedule fs
                LEFT JOIN Staff s ON fs.StaffID = s.StaffID
                WHERE fs.AnimalID = @animalId AND fs.DeletedAt IS NULL
                ORDER BY fs.FeedTime
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching feeding schedules for animal:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── POST create feeding schedule ────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
    try {
        const { AnimalID, FeedTime, FoodType, StaffID } = req.body;
        if (!AnimalID || !FeedTime || !FoodType || !StaffID) {
            return res.status(400).json({ error: 'AnimalID, FeedTime, FoodType, and StaffID are required.' });
        }
        const pool = await connectToDb();
        const result = await pool.request()
            .input('animalId', sql.Int, parseInt(AnimalID, 10))
            .input('feedTime', sql.DateTime2, new Date(FeedTime))
            .input('foodType', sql.NVarChar(100), FoodType)
            .input('staffId', sql.Int, parseInt(StaffID, 10))
            .input('createdBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`
                INSERT INTO FeedingSchedule (AnimalID, FeedTime, FoodType, StaffID, CreatedAt, CreatedBy)
                OUTPUT INSERTED.ScheduleID
                VALUES (@animalId, @feedTime, @foodType, @staffId, SYSUTCDATETIME(), @createdBy)
            `);
        res.status(201).json({ ScheduleID: result.recordset[0].ScheduleID, ...req.body });
    } catch (error) {
        console.error('Error creating feeding schedule:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── PUT update feeding schedule ─────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { AnimalID, FeedTime, FoodType, StaffID } = req.body;
        if (!AnimalID || !FeedTime || !FoodType || !StaffID) {
            return res.status(400).json({ error: 'AnimalID, FeedTime, FoodType, and StaffID are required.' });
        }
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('animalId', sql.Int, parseInt(AnimalID, 10))
            .input('feedTime', sql.DateTime2, new Date(FeedTime))
            .input('foodType', sql.NVarChar(100), FoodType)
            .input('staffId', sql.Int, parseInt(StaffID, 10))
            .input('updatedBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`
                UPDATE FeedingSchedule
                SET AnimalID = @animalId, FeedTime = @feedTime, FoodType = @foodType,
                    StaffID = @staffId, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
                WHERE ScheduleID = @id AND DeletedAt IS NULL
            `);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating feeding schedule:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── DELETE (soft) feeding schedule ──────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('deletedBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`UPDATE FeedingSchedule SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE ScheduleID = @id`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting feeding schedule:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
