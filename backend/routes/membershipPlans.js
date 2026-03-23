const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');
const sql = require('mssql');

// GET /api/membership-plans — all active plans (public)
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(
            `SELECT PlanID, Name, Description, MonthlyPrice, YearlyPrice,
                    Features, IsPopular, SortOrder, CreatedAt
             FROM MembershipPlans
             WHERE DeletedAt IS NULL
             ORDER BY SortOrder ASC`
        );
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
            .query(`
                INSERT INTO MembershipPlans (Name, Description, MonthlyPrice, YearlyPrice, Features, IsPopular, SortOrder)
                OUTPUT INSERTED.PlanID
                VALUES (@Name, @Description, @MonthlyPrice, @YearlyPrice, @Features, @IsPopular, @SortOrder)
            `);
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
            .query(`
                UPDATE MembershipPlans
                SET Name=@Name, Description=@Description, MonthlyPrice=@MonthlyPrice,
                    YearlyPrice=@YearlyPrice, Features=@Features, IsPopular=@IsPopular, SortOrder=@SortOrder
                WHERE PlanID=@id AND DeletedAt IS NULL
            `);
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
            .query(`UPDATE MembershipPlans SET DeletedAt = SYSUTCDATETIME() WHERE PlanID = @id`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
