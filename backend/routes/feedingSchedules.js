const { Router } = require('../lib/router');
const router = new Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');
const Q = require('../queries/feedingQueries');

// ── GET all feeding schedules (joined with Animal + Staff) ──────────
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(Q.getAll);
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
            .query(Q.getByAnimal);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching feeding schedules for animal:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── POST create feeding schedule ────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
    try {
        const { AnimalID, FeedTime, FoodType, StaffID, Quantity, Unit, Frequency, SpecialInstructions } = req.body;
        if (!AnimalID || !FeedTime || !FoodType || !StaffID) {
            return res.status(400).json({ error: 'AnimalID, FeedTime, FoodType, and StaffID are required.' });
        }
        const pool = await connectToDb();
        const result = await pool.request()
            .input('animalId', sql.Int, parseInt(AnimalID, 10))
            .input('feedTime', sql.DateTime2, new Date(FeedTime))
            .input('foodType', sql.NVarChar(100), FoodType)
            .input('staffId', sql.Int, parseInt(StaffID, 10))
            .input('quantity', sql.Decimal(10, 2), Quantity != null && Quantity !== '' ? parseFloat(Quantity) : null)
            .input('unit', sql.NVarChar(50), Unit || null)
            .input('frequency', sql.NVarChar(50), Frequency || null)
            .input('specialInstructions', sql.NVarChar(500), SpecialInstructions || null)
            .input('createdBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(Q.insert);
        res.status(201).json({ ScheduleID: result.recordset[0].ScheduleID, ...req.body });
    } catch (error) {
        console.error('Error creating feeding schedule:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── PUT update feeding schedule ─────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { AnimalID, FeedTime, FoodType, StaffID, Quantity, Unit, Frequency, SpecialInstructions } = req.body;
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
            .input('quantity', sql.Decimal(10, 2), Quantity != null && Quantity !== '' ? parseFloat(Quantity) : null)
            .input('unit', sql.NVarChar(50), Unit || null)
            .input('frequency', sql.NVarChar(50), Frequency || null)
            .input('specialInstructions', sql.NVarChar(500), SpecialInstructions || null)
            .input('updatedBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(Q.update);
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
            .query(Q.softDelete);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting feeding schedule:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
