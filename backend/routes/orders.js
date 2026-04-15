const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');
const sql = require('mssql');
const Q = require('../queries/orderQueries');

// POST /api/orders — place a new order (no auth required, public)
router.post('/', async (req, res) => {
    const {
        firstName, lastName, email, phone,
        addressLine1, addressLine2,
        city, stateProvince, zipCode,
        billingSameAsShipping,
        cardLastFour,
        subtotal, shipping, tax, total,
        orderItems
    } = req.body;
    if (!firstName || !lastName || !email || !addressLine1 || !city || !stateProvince || !zipCode) {
        return res.status(400).json({ error: 'Missing required shipping fields.' });
    }

    try {
        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // Insert the order
            const insertReq = new sql.Request(transaction);
            const result = await insertReq
                .input('FirstName',             sql.NVarChar(50),  firstName)
                .input('LastName',              sql.NVarChar(50),  lastName)
                .input('Email',                 sql.NVarChar(200), email)
                .input('Phone',                 sql.NVarChar(30),  phone || null)
                .input('AddressLine1',          sql.NVarChar(200), addressLine1)
                .input('AddressLine2',          sql.NVarChar(200), addressLine2 || null)
                .input('City',                  sql.NVarChar(100), city)
                .input('StateProvince',         sql.NVarChar(100), stateProvince)
                .input('ZipCode',               sql.NVarChar(20),  zipCode)
                .input('BillingSameAsShipping', sql.Bit,           billingSameAsShipping ? 1 : 0)
                .input('CardLastFour',          sql.NVarChar(4),   cardLastFour || null)
                .input('Subtotal',              sql.Decimal(10,2), subtotal)
                .input('Shipping',              sql.Decimal(10,2), shipping)
                .input('Tax',                   sql.Decimal(10,2), tax)
                .input('Total',                 sql.Decimal(10,2), total)
                .input('OrderItems',            sql.NVarChar(sql.MAX), orderItems || null)
                .query(Q.insert);

            const orderId = result.recordset[0].OrderID;

            await transaction.commit();
            res.status(201).json({ success: true, orderId });
        } catch (txErr) {
            try { await transaction.rollback(); } catch (_) { /* already rolled back or never began */ }
            throw txErr;
        }
    } catch (err) {
        console.error('Order error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders — paginated + filtered list (admin)
router.get('/', async (req, res) => {
    try {
        const limit  = Math.min(parseInt(req.query.limit)  || 100, 200);
        const offset = parseInt(req.query.offset) || 0;
        const search   = (req.query.search   || '').trim();
        const dateFrom = req.query.dateFrom || null;
        const dateTo   = req.query.dateTo   || null;

        const pool = await connectToDb();

        const conditions = [];
        if (search)   conditions.push(`(CONCAT(ISNULL(FirstName,''),' ',ISNULL(LastName,'')) LIKE @search OR Email LIKE @search OR CAST(OrderID AS NVARCHAR) LIKE @search)`);
        if (dateFrom) conditions.push(`PlacedAt >= @dateFrom`);
        if (dateTo)   conditions.push(`PlacedAt <= @dateTo`);
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const addFilters = (r) => {
            if (search)   r.input('search',   sql.NVarChar,  `%${search}%`);
            if (dateFrom) r.input('dateFrom', sql.DateTime2, new Date(dateFrom));
            if (dateTo)   r.input('dateTo',   sql.DateTime2, new Date(dateTo));
            return r;
        };

        const [dataResult, countResult] = await Promise.all([
            addFilters(pool.request())
                .input('limit',  sql.Int, limit)
                .input('offset', sql.Int, offset)
                .query(Q.list(where)),
            addFilters(pool.request())
                .query(Q.count(where)),
        ]);

        res.json({ rows: dataResult.recordset, total: countResult.recordset[0].total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:id — fetch single order with full details (admin)
router.get('/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query(Q.getById);
        if (!result.recordset.length) return res.status(404).json({ error: 'Order not found.' });
        const row = result.recordset[0];
        let items = [];
        try { items = row.OrderItems ? JSON.parse(row.OrderItems) : []; } catch { items = []; }
        res.json({ ...row, items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
