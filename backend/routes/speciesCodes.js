const express = require('express');
const router  = express.Router();
const sql     = require('mssql');
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/species-codes — all entries
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const r = await pool.request().query(
            'SELECT SpeciesName as speciesName, CodeSuffix as codeSuffix, LastCount as lastCount FROM SpeciesCode ORDER BY SpeciesName'
        );
        res.json(r.recordset);
    } catch (err) {
        console.error('Error fetching species codes:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/species-codes/next?species=Lion — preview next ID (no increment)
router.get('/next', async (req, res) => {
    try {
        const { species } = req.query;
        if (!species) return res.status(400).json({ error: 'species query param required' });
        const pool = await connectToDb();
        const r = await pool.request()
            .input('sn', sql.NVarChar, species)
            .query('SELECT CodeSuffix, LastCount FROM SpeciesCode WHERE SpeciesName = @sn');
        if (!r.recordset.length) return res.status(404).json({ error: 'Species code not found' });
        const { CodeSuffix, LastCount } = r.recordset[0];
        const next = String(LastCount + 1).padStart(5, '0');
        res.json({ animalCode: `${CodeSuffix}-${next}`, codeSuffix: CodeSuffix, nextCount: LastCount + 1 });
    } catch (err) {
        console.error('Error fetching next species code:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/species-codes — create { speciesName, codeSuffix }
router.post('/', verifyToken, async (req, res) => {
    try {
        const { speciesName, codeSuffix } = req.body;
        if (!speciesName || !codeSuffix) {
            return res.status(400).json({ error: 'speciesName and codeSuffix are required' });
        }
        const pool = await connectToDb();
        await pool.request()
            .input('sn', sql.NVarChar, speciesName.trim())
            .input('cs', sql.NVarChar, codeSuffix.trim().toLowerCase())
            .query('INSERT INTO SpeciesCode (SpeciesName, CodeSuffix) VALUES (@sn, @cs)');
        res.status(201).json({ speciesName: speciesName.trim(), codeSuffix: codeSuffix.trim().toLowerCase(), lastCount: 0 });
    } catch (err) {
        console.error('Error creating species code:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
