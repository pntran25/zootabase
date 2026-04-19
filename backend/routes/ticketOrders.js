const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');
const sql = require('mssql');
const Q = require('../queries/ticketQueries');
const { optionalAuth } = require('../middleware/authMiddleware');

// POST /api/ticket-orders — place a ticket order
router.post('/', optionalAuth, async (req, res) => {
    const {
        firstName, lastName, email, phone,
        addressLine1, addressLine2, city, stateProvince, zipCode,
        billingSameAsContact,
        billingFullName, billingAddress1, billingAddress2, billingCity, billingState, billingZip,
        visitDate, ticketType,
        adultQty, childQty, seniorQty,
        adultUnitPrice, childUnitPrice, seniorUnitPrice,
        addOns,
        cardLastFour,
        subtotal, total,
    } = req.body;
    if (!firstName || !lastName || !email || !visitDate || !ticketType) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (!addressLine1 || !city || !stateProvince || !zipCode) {
        return res.status(400).json({ error: 'Missing required address fields.' });
    }
    if ((adultQty + childQty + seniorQty) < 1) {
        return res.status(400).json({ error: 'At least one ticket is required.' });
    }

    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('CustomerID',          sql.Int,               req.userProfile?.CustomerID || null)
            .input('FirstName',           sql.NVarChar(50),      firstName)
            .input('LastName',            sql.NVarChar(50),      lastName)
            .input('Email',               sql.NVarChar(200),     email)
            .input('Phone',               sql.NVarChar(30),      phone || null)
            .input('AddressLine1',        sql.NVarChar(200),     addressLine1)
            .input('AddressLine2',        sql.NVarChar(200),     addressLine2 || null)
            .input('City',                sql.NVarChar(100),     city)
            .input('StateProvince',       sql.NVarChar(100),     stateProvince)
            .input('ZipCode',             sql.NVarChar(20),      zipCode)
            .input('BillingSameAsContact',sql.Bit,               billingSameAsContact !== false ? 1 : 0)
            .input('BillingFullName',     sql.NVarChar(100),     billingSameAsContact !== false ? null : (billingFullName || null))
            .input('BillingAddress1',     sql.NVarChar(200),     billingSameAsContact !== false ? null : (billingAddress1 || null))
            .input('BillingAddress2',     sql.NVarChar(200),     billingSameAsContact !== false ? null : (billingAddress2 || null))
            .input('BillingCity',         sql.NVarChar(100),     billingSameAsContact !== false ? null : (billingCity || null))
            .input('BillingState',        sql.NVarChar(100),     billingSameAsContact !== false ? null : (billingState || null))
            .input('BillingZip',          sql.NVarChar(20),      billingSameAsContact !== false ? null : (billingZip || null))
            .input('VisitDate',           sql.Date,              new Date(visitDate))
            .input('TicketType',          sql.NVarChar(100),     ticketType)
            .input('AdultQty',            sql.Int,               adultQty || 0)
            .input('ChildQty',            sql.Int,               childQty || 0)
            .input('SeniorQty',           sql.Int,               seniorQty || 0)
            .input('AdultUnitPrice',      sql.Decimal(10, 2),    adultUnitPrice  || null)
            .input('ChildUnitPrice',      sql.Decimal(10, 2),    childUnitPrice  || null)
            .input('SeniorUnitPrice',     sql.Decimal(10, 2),    seniorUnitPrice || null)
            .input('AddOns',              sql.NVarChar(sql.MAX), addOns ? JSON.stringify(addOns) : null)
            .input('CardLastFour',        sql.NVarChar(4),       cardLastFour || null)
            .input('Subtotal',            sql.Decimal(10, 2),    subtotal)
            .input('Total',               sql.Decimal(10, 2),    total)
            .query(Q.insertOrder);

        res.status(201).json({ success: true, ticketOrderId: result.recordset[0].TicketOrderID });
    } catch (err) {
        console.error('Ticket order error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ticket-orders — paginated + filtered list (admin)
router.get('/', async (req, res) => {
    try {
        const limit  = Math.min(parseInt(req.query.limit)  || 100, 200);
        const offset = parseInt(req.query.offset) || 0;
        const search   = (req.query.search   || '').trim();
        const dateFrom = req.query.dateFrom || null;
        const dateTo   = req.query.dateTo   || null;

        const pool = await connectToDb();

        const conditions = [];
        if (search)   conditions.push(`(CONCAT(ISNULL(FirstName,''),' ',ISNULL(LastName,'')) LIKE @search OR Email LIKE @search OR CAST(TicketOrderID AS NVARCHAR) LIKE @search)`);
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
                .query(Q.listOrders(where)),
            addFilters(pool.request())
                .query(Q.countOrders(where)),
        ]);

        res.json({ rows: dataResult.recordset, total: countResult.recordset[0].total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ticket-orders/:id — full detail (admin)
router.get('/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query(Q.getOrderById);
        if (!result.recordset.length) return res.status(404).json({ error: 'Ticket order not found.' });
        const row = result.recordset[0];
        let addOns = [];
        try { addOns = row.AddOns ? JSON.parse(row.AddOns) : []; } catch { addOns = []; }
        res.json({ ...row, addOns });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
