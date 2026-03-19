const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');

// GET all attractions
router.get('/api/attractions', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT * FROM Attraction WHERE DeletedAt IS NULL');
        
        // Map DB columns to JSON keys for frontend
        const mappedResult = result.recordset.map(row => ({
            id: row.AttractionID.toString(),
            name: row.AttractionName,
            type: row.AttractionType,
            location: row.LocationDesc,
            capacity: row.CapacityVisitors,
            status: row.ActiveFlag ? 'Open' : 'Closed'
        }));
        
        res.json(mappedResult);
    } catch (error) {
        console.error('Error fetching attractions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST new attraction
router.post('/api/attractions', async (req, res) => {
    try {
        const { name, type, location, capacity, status } = req.body;
        const activeFlag = status === 'Open' ? 1 : 0;
        const pool = await connectToDb();
        
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('type', sql.NVarChar, type)
            .input('location', sql.NVarChar, location)
            .input('capacity', sql.Int, parseInt(capacity, 10))
            .input('activeFlag', sql.Bit, activeFlag)
            .query(`
                DECLARE @Out TABLE (AttractionID INT);
                INSERT INTO Attraction (AttractionName, AttractionType, LocationDesc, CapacityVisitors, ActiveFlag)
                OUTPUT INSERTED.AttractionID INTO @Out
                VALUES (@name, @type, @location, @capacity, @activeFlag);
                SELECT AttractionID FROM @Out;
            `);
            
        res.status(201).json({ id: result.recordset[0].AttractionID.toString(), ...req.body });
    } catch (error) {
        console.error('Error creating attraction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT update attraction
router.put('/api/attractions/:id', async (req, res) => {
    try {
        const { name, type, location, capacity, status } = req.body;
        const activeFlag = status === 'Open' ? 1 : 0;
        const pool = await connectToDb();
        
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('name', sql.NVarChar, name)
            .input('type', sql.NVarChar, type)
            .input('location', sql.NVarChar, location)
            .input('capacity', sql.Int, parseInt(capacity, 10))
            .input('activeFlag', sql.Bit, activeFlag)
            .query(`
                UPDATE Attraction 
                SET AttractionName = @name, AttractionType = @type, LocationDesc = @location, 
                    CapacityVisitors = @capacity, ActiveFlag = @activeFlag, UpdatedAt = SYSUTCDATETIME()
                WHERE AttractionID = @id
            `);
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating attraction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE attraction (soft delete)
router.delete('/api/attractions/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query('UPDATE Attraction SET DeletedAt = SYSUTCDATETIME() WHERE AttractionID = @id');
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting attraction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
