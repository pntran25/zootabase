const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');
const sql = require('mssql');
const { verifyToken } = require('../middleware/authMiddleware');
const Q = require('../queries/membershipQueries');

// POST /api/membership-subscriptions — purchase a membership
router.post('/', async (req, res) => {
    const {
        customerId,
        planName, billingPeriod,
        firstName, lastName, email, phone,
        addressLine1, addressLine2, city, stateProvince, zipCode,
        billingSameAsContact,
        billingFullName, billingAddress1, billingAddress2, billingCity, billingState, billingZip,
        cardLastFour,
        total,
    } = req.body;
    if (!firstName || !lastName || !email || !planName || !billingPeriod) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (!addressLine1 || !city || !stateProvince || !zipCode) {
        return res.status(400).json({ error: 'Missing required address fields.' });
    }

    // Compute start/end dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (billingPeriod === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
        endDate.setMonth(endDate.getMonth() + 1);
    }

    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('CustomerID',          sql.Int,               customerId || null)
            .input('PlanName',            sql.NVarChar(100),     planName)
            .input('BillingPeriod',       sql.NVarChar(10),      billingPeriod)
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
            .input('CardLastFour',        sql.NVarChar(4),       cardLastFour || null)
            .input('Total',               sql.Decimal(10, 2),    total)
            .input('StartDate',           sql.Date,              startDate)
            .input('EndDate',             sql.Date,              endDate)
            .query(Q.insertSubscription);
        res.status(201).json({ success: true, subId: result.recordset[0].SubID });
    } catch (err) {
        console.error('Membership subscription error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/membership-subscriptions — paginated + filtered list (admin / data reports)
router.get('/', async (req, res) => {
    try {
        const limit  = Math.min(parseInt(req.query.limit)  || 100, 200);
        const offset = parseInt(req.query.offset) || 0;
        const search   = (req.query.search   || '').trim();
        const dateFrom = req.query.dateFrom || null;
        const dateTo   = req.query.dateTo   || null;

        const pool = await connectToDb();

        // Build shared WHERE clause + a helper that attaches inputs to any request
        const conditions = [];
        if (search)   conditions.push(`(CONCAT(ISNULL(FirstName,''),' ',ISNULL(LastName,'')) LIKE @search OR Email LIKE @search OR CAST(SubID AS NVARCHAR) LIKE @search)`);
        if (dateFrom) conditions.push(`PlacedAt >= @dateFrom`);
        if (dateTo)   conditions.push(`PlacedAt <= @dateTo`);
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const addFilters = (r) => {
            if (search)   r.input('search',   sql.NVarChar,   `%${search}%`);
            if (dateFrom) r.input('dateFrom', sql.DateTime2,  new Date(dateFrom));
            if (dateTo)   r.input('dateTo',   sql.DateTime2,  new Date(dateTo));
            return r;
        };

        const [dataResult, countResult] = await Promise.all([
            addFilters(pool.request())
                .input('limit',  sql.Int, limit)
                .input('offset', sql.Int, offset)
                .query(Q.listSubscriptions(where)),
            addFilters(pool.request())
                .query(Q.countSubscriptions(where)),
        ]);

        res.json({ rows: dataResult.recordset, total: countResult.recordset[0].total });
    } catch (err) {
        console.error('Membership subscriptions list error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/membership-subscriptions/active — active sub for the logged-in user + gift shop discount
router.get('/active', verifyToken, async (req, res) => {
    const email = req.user.email;
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('Email', sql.NVarChar(200), email)
            .query(Q.getActiveByEmail);

        if (!result.recordset.length) return res.json({ active: false });

        const row = result.recordset[0];
        let features = [];
        try { features = JSON.parse(row.Features || '[]'); } catch {}

        // Parse gift shop discount from feature text, e.g. "20% discount at Gift Shop"
        let giftShopDiscount = 0;
        for (const f of features) {
            if (!f.included) continue;
            const match = f.text.match(/(\d+)%.*gift\s*shop/i);
            if (match) { giftShopDiscount = parseInt(match[1], 10); break; }
        }

        res.json({ active: true, planName: row.PlanName, endDate: row.EndDate, giftShopDiscount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/membership-subscriptions/cancel — cancel the logged-in user's active membership
router.post('/cancel', verifyToken, async (req, res) => {
    const email = req.user.email;
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('Email', sql.NVarChar(200), email)
            .query(Q.cancelSubscriptionByEmail);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'No active membership found.' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Cancel membership error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/membership-subscriptions/:id — full detail (admin)
router.get('/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query(Q.getSubscriptionById);
        if (!result.recordset.length) return res.status(404).json({ error: 'Subscription not found.' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
