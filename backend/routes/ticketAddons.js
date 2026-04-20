const { Router } = require('../lib/router');
const router = new Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const Q = require('../queries/ticketQueries');

// GET /api/ticket-addons
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(Q.getAllAddons);
        const rows = result.recordset.map(r => ({
            addonId:     r.AddonID,
            name:        r.Name,
            description: r.Description,
            price:       Number(r.Price),
            sortOrder:   r.SortOrder,
        }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ticket-addons
router.post('/', async (req, res) => {
    const { name, description, price, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('Name',        sql.NVarChar(100), name)
            .input('Description', sql.NVarChar(200), description || null)
            .input('Price',       sql.Decimal(10,2), price       || 0)
            .input('SortOrder',   sql.Int,           sortOrder   || 0)
            .query(Q.insertAddon);
        res.status(201).json({ addonId: result.recordset[0].AddonID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/ticket-addons/:id
router.put('/:id', async (req, res) => {
    const { name, description, price, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id',          sql.Int,           parseInt(req.params.id, 10))
            .input('Name',        sql.NVarChar(100), name)
            .input('Description', sql.NVarChar(200), description || null)
            .input('Price',       sql.Decimal(10,2), price       || 0)
            .input('SortOrder',   sql.Int,           sortOrder   || 0)
            .query(Q.updateAddon);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/ticket-addons/:id
router.delete('/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query(Q.deleteAddon);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
