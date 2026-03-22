const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');
const sql = require('mssql');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/membership-subscriptions — purchase a membership
router.post('/', async (req, res) => {
    const {
        customerId,
        planName, billingPeriod,
        fullName, email, phone,
        addressLine1, addressLine2, city, stateProvince, zipCode,
        billingSameAsContact,
        billingFullName, billingAddress1, billingAddress2, billingCity, billingState, billingZip,
        cardLastFour,
        total,
    } = req.body;

    if (!fullName || !email || !planName || !billingPeriod) {
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
            .input('FullName',            sql.NVarChar(100),     fullName)
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
            .query(`
                INSERT INTO MembershipSubscriptions
                    (CustomerID, PlanName, BillingPeriod, FullName, Email, Phone,
                     AddressLine1, AddressLine2, City, StateProvince, ZipCode,
                     BillingSameAsContact, BillingFullName, BillingAddress1, BillingAddress2,
                     BillingCity, BillingState, BillingZip,
                     CardLastFour, Total, StartDate, EndDate)
                OUTPUT INSERTED.SubID
                VALUES
                    (@CustomerID, @PlanName, @BillingPeriod, @FullName, @Email, @Phone,
                     @AddressLine1, @AddressLine2, @City, @StateProvince, @ZipCode,
                     @BillingSameAsContact, @BillingFullName, @BillingAddress1, @BillingAddress2,
                     @BillingCity, @BillingState, @BillingZip,
                     @CardLastFour, @Total, @StartDate, @EndDate)
            `);
        res.status(201).json({ success: true, subId: result.recordset[0].SubID });
    } catch (err) {
        console.error('Membership subscription error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/membership-subscriptions — list all (admin / data reports)
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(
            `SELECT SubID, FullName, Email, PlanName, BillingPeriod, Total, StartDate, EndDate, PlacedAt
             FROM MembershipSubscriptions ORDER BY PlacedAt DESC`
        );
        res.json(result.recordset);
    } catch (err) {
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
            .query(`
                SELECT TOP 1 ms.PlanName, ms.EndDate, mp.Features
                FROM MembershipSubscriptions ms
                LEFT JOIN MembershipPlans mp
                    ON mp.Name = ms.PlanName AND mp.DeletedAt IS NULL
                WHERE ms.Email = @Email
                  AND ms.EndDate >= CAST(GETDATE() AS DATE)
                ORDER BY ms.EndDate DESC
            `);

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

// GET /api/membership-subscriptions/:id — full detail (admin)
router.get('/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query(`SELECT * FROM MembershipSubscriptions WHERE SubID = @id`);
        if (!result.recordset.length) return res.status(404).json({ error: 'Subscription not found.' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
