const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');
const sql = require('mssql');

// POST /api/ticket-orders — place a ticket order
router.post('/', async (req, res) => {
    const {
        fullName, email, phone,
        visitDate, ticketType,
        adultQty, childQty, seniorQty,
        addOns,
        billingAddress,
        cardLastFour,
        subtotal, total,
    } = req.body;

    if (!fullName || !email || !visitDate || !ticketType) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }
    if ((adultQty + childQty + seniorQty) < 1) {
        return res.status(400).json({ error: 'At least one ticket is required.' });
    }

    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('FullName',       sql.NVarChar(100),     fullName)
            .input('Email',          sql.NVarChar(200),     email)
            .input('Phone',          sql.NVarChar(30),      phone || null)
            .input('VisitDate',      sql.Date,              new Date(visitDate))
            .input('TicketType',     sql.NVarChar(100),     ticketType)
            .input('AdultQty',       sql.Int,               adultQty || 0)
            .input('ChildQty',       sql.Int,               childQty || 0)
            .input('SeniorQty',      sql.Int,               seniorQty || 0)
            .input('AddOns',         sql.NVarChar(sql.MAX), addOns ? JSON.stringify(addOns) : null)
            .input('BillingAddress', sql.NVarChar(500),     billingAddress || null)
            .input('CardLastFour',   sql.NVarChar(4),       cardLastFour || null)
            .input('Subtotal',       sql.Decimal(10, 2),    subtotal)
            .input('Total',          sql.Decimal(10, 2),    total)
            .query(`
                INSERT INTO TicketOrders
                    (FullName, Email, Phone, VisitDate, TicketType, AdultQty, ChildQty, SeniorQty,
                     AddOns, BillingAddress, CardLastFour, Subtotal, Total)
                OUTPUT INSERTED.TicketOrderID
                VALUES
                    (@FullName, @Email, @Phone, @VisitDate, @TicketType, @AdultQty, @ChildQty, @SeniorQty,
                     @AddOns, @BillingAddress, @CardLastFour, @Subtotal, @Total)
            `);

        res.status(201).json({ success: true, ticketOrderId: result.recordset[0].TicketOrderID });
    } catch (err) {
        console.error('Ticket order error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ticket-orders — list all (admin)
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(
            `SELECT TicketOrderID, FullName, Email, VisitDate, TicketType,
                    AdultQty, ChildQty, SeniorQty, Total, CardLastFour, PlacedAt
             FROM TicketOrders ORDER BY PlacedAt DESC`
        );
        res.json(result.recordset);
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
            .query(`SELECT * FROM TicketOrders WHERE TicketOrderID = @id`);
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
