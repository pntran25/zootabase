const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');
const sql = require('mssql');
const { verifyToken } = require('../middleware/authMiddleware');
const Q = require('../queries/profileQueries');

// GET /api/profile/orders — get current user's gift shop orders + ticket orders
router.get('/orders', verifyToken, async (req, res) => {
    const email = req.userProfile?.Email || req.user?.email;
    if (!email) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const pool = await connectToDb();

        const [shopResult, ticketResult] = await Promise.all([
            pool.request()
                .input('email', sql.NVarChar(200), email)
                .query(Q.shopOrders),
            pool.request()
                .input('email', sql.NVarChar(200), email)
                .query(Q.ticketOrders),
        ]);

        const shopOrders = shopResult.recordset.map(row => {
            let items = [];
            try { items = row.OrderItems ? JSON.parse(row.OrderItems) : []; } catch { items = []; }
            return { ...row, items, type: 'shop' };
        });

        const ticketOrders = ticketResult.recordset.map(row => {
            let addOns = [];
            try { addOns = row.AddOns ? JSON.parse(row.AddOns) : []; } catch { addOns = []; }
            return { ...row, addOns, type: 'ticket' };
        });

        res.json({ shopOrders, ticketOrders });
    } catch (err) {
        console.error('Profile orders error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/profile/membership — get current user's active membership
router.get('/membership', verifyToken, async (req, res) => {
    const email = req.userProfile?.Email || req.user?.email;
    if (!email) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('email', sql.NVarChar(200), email)
            .query(Q.membership);

        res.json({ membership: result.recordset[0] || null });
    } catch (err) {
        console.error('Profile membership error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
