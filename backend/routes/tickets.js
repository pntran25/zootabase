const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { optionalAuth } = require('../middleware/authMiddleware');

// GET all ticket types
router.get('/api/tickets', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM TicketType WHERE DeletedAt IS NULL');
        
        const mappedResult = result.recordset.map(row => ({
            id: row.TicketTypeID.toString(),
            type: row.TypeName,
            category: row.Category,
            desc: row.Description || '',
            price: row.BasePrice || 0,
            createdBy: row.CreatedBy || null,
            updatedBy: row.UpdatedBy || null,
        }));
        
        res.json(mappedResult);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST new ticket type
router.post('/api/tickets', optionalAuth, async (req, res) => {
    try {
        const { type, category, desc, price } = req.body;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        const pool = await connectToDb();

        const result = await pool.request()
            .input('type', sql.NVarChar, type)
            .input('category', sql.NVarChar, category)
            .input('desc', sql.NVarChar, desc)
            .input('price', sql.Decimal(10, 2), price)
            .input('createdBy', sql.NVarChar, adminName)
            .query(`
                DECLARE @Out TABLE (TicketTypeID INT);
                INSERT INTO TicketType (TypeName, Category, Description, BasePrice, CreatedBy)
                OUTPUT INSERTED.TicketTypeID INTO @Out
                VALUES (@type, @category, @desc, @price, @createdBy);
                SELECT TicketTypeID FROM @Out;
            `);
            
        res.status(201).json({ id: result.recordset[0].TicketTypeID.toString(), ...req.body });
    } catch (error) {
        console.error('Error creating ticket type:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update ticket type
router.put('/api/tickets/:id', optionalAuth, async (req, res) => {
    try {
        const { type, category, desc, price } = req.body;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        const pool = await connectToDb();

        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('type', sql.NVarChar, type)
            .input('category', sql.NVarChar, category)
            .input('desc', sql.NVarChar, desc)
            .input('price', sql.Decimal(10, 2), price)
            .input('updatedBy', sql.NVarChar, adminName)
            .query(`
                UPDATE TicketType
                SET TypeName = @type, Category = @category, Description = @desc,
                    BasePrice = @price, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
                WHERE TicketTypeID = @id
            `);
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating ticket type:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE ticket type (soft delete)
router.delete('/api/tickets/:id', optionalAuth, async (req, res) => {
    try {
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('deletedBy', sql.NVarChar, adminName)
            .query('UPDATE TicketType SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE TicketTypeID = @id');
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting ticket type:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
