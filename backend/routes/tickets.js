const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');

// GET all ticket types
router.get('/api/tickets', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM TicketType WHERE DeletedAt IS NULL');
        
        const mappedResult = result.recordset.map(row => ({
            id: row.TicketTypeID.toString(),
            type: row.TypeName, // Maps to "Ticket Name" in UI
            category: row.Category,
            desc: row.Description || '',
            price: row.BasePrice || 0
        }));
        
        res.json(mappedResult);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST new ticket type
router.post('/api/tickets', async (req, res) => {
    try {
        const { type, category, desc, price } = req.body;
        const pool = await connectToDb();
        
        const result = await pool.request()
            .input('type', sql.NVarChar, type)
            .input('category', sql.NVarChar, category)
            .input('desc', sql.NVarChar, desc)
            .input('price', sql.Decimal(10, 2), price)
            .query(`
                DECLARE @Out TABLE (TicketTypeID INT);
                INSERT INTO TicketType (TypeName, Category, Description, BasePrice)
                OUTPUT INSERTED.TicketTypeID INTO @Out
                VALUES (@type, @category, @desc, @price);
                SELECT TicketTypeID FROM @Out;
            `);
            
        res.status(201).json({ id: result.recordset[0].TicketTypeID.toString(), ...req.body });
    } catch (error) {
        console.error('Error creating ticket type:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT update ticket type
router.put('/api/tickets/:id', async (req, res) => {
    try {
        const { type, category, desc, price } = req.body;
        const pool = await connectToDb();
        
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('type', sql.NVarChar, type)
            .input('category', sql.NVarChar, category)
            .input('desc', sql.NVarChar, desc)
            .input('price', sql.Decimal(10, 2), price)
            .query(`
                UPDATE TicketType 
                SET TypeName = @type, Category = @category, Description = @desc, 
                    BasePrice = @price, UpdatedAt = SYSUTCDATETIME()
                WHERE TicketTypeID = @id
            `);
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating ticket type:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE ticket type (soft delete)
router.delete('/api/tickets/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query('UPDATE TicketType SET DeletedAt = SYSUTCDATETIME() WHERE TicketTypeID = @id');
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting ticket type:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
