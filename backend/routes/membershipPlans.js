const { Router } = require('../lib/router');
const router = new Router();
const { connectToDb } = require('../services/admin');
const sql = require('mssql');
const Q = require('../queries/membershipQueries');

// GET /api/membership-plans — all active plans (public)
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(Q.getAllPlans);
        const plans = result.recordset.map(row => ({
            ...row,
            Features: row.Features ? JSON.parse(row.Features) : [],
        }));
        res.json(plans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/membership-plans — create (admin)
router.post('/', async (req, res) => {
    const { name, description, monthlyPrice, yearlyPrice, features, isPopular, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Plan name is required.' });
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('Name',         sql.NVarChar(100),     name)
            .input('Description',  sql.NVarChar(500),     description || null)
            .input('MonthlyPrice', sql.Decimal(10, 2),    monthlyPrice || 0)
            .input('YearlyPrice',  sql.Decimal(10, 2),    yearlyPrice || 0)
            .input('Features',     sql.NVarChar(sql.MAX), features ? JSON.stringify(features) : null)
            .input('IsPopular',    sql.Bit,               isPopular ? 1 : 0)
            .input('SortOrder',    sql.Int,               sortOrder || 0)
            .query(Q.insertPlan);
        res.status(201).json({ success: true, planId: result.recordset[0].PlanID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/membership-plans/:id — update (admin)
router.put('/:id', async (req, res) => {
    const { name, description, monthlyPrice, yearlyPrice, features, isPopular, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Plan name is required.' });
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id',           sql.Int,               parseInt(req.params.id, 10))
            .input('Name',         sql.NVarChar(100),     name)
            .input('Description',  sql.NVarChar(500),     description || null)
            .input('MonthlyPrice', sql.Decimal(10, 2),    monthlyPrice || 0)
            .input('YearlyPrice',  sql.Decimal(10, 2),    yearlyPrice || 0)
            .input('Features',     sql.NVarChar(sql.MAX), features ? JSON.stringify(features) : null)
            .input('IsPopular',    sql.Bit,               isPopular ? 1 : 0)
            .input('SortOrder',    sql.Int,               sortOrder || 0)
            .query(Q.updatePlan);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/membership-plans/:id — soft delete (admin)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query(Q.deletePlan);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
