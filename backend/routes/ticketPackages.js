const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');

// GET /api/ticket-packages
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(
            `SELECT PackageID, Name, Description, AdultPrice, ChildPrice, SeniorPrice,
                    IsMostPopular, Features, SortOrder
             FROM TicketPackage WHERE DeletedAt IS NULL ORDER BY SortOrder`
        );
        const rows = result.recordset.map(r => ({
            packageId:     r.PackageID,
            name:          r.Name,
            description:   r.Description,
            adultPrice:    Number(r.AdultPrice),
            childPrice:    Number(r.ChildPrice),
            seniorPrice:   Number(r.SeniorPrice),
            isMostPopular: !!r.IsMostPopular,
            features:      (() => { try { return JSON.parse(r.Features || '[]'); } catch { return []; } })(),
            sortOrder:     r.SortOrder,
        }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ticket-packages
router.post('/', async (req, res) => {
    const { name, description, adultPrice, childPrice, seniorPrice, isMostPopular, features, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('Name',          sql.NVarChar(100),  name)
            .input('Description',   sql.NVarChar(500),  description || null)
            .input('AdultPrice',    sql.Decimal(10,2),  adultPrice  || 0)
            .input('ChildPrice',    sql.Decimal(10,2),  childPrice  || 0)
            .input('SeniorPrice',   sql.Decimal(10,2),  seniorPrice || 0)
            .input('IsMostPopular', sql.Bit,            isMostPopular ? 1 : 0)
            .input('Features',      sql.NVarChar(sql.MAX), JSON.stringify(features || []))
            .input('SortOrder',     sql.Int,            sortOrder   || 0)
            .query(`
                INSERT INTO TicketPackage (Name,Description,AdultPrice,ChildPrice,SeniorPrice,IsMostPopular,Features,SortOrder)
                OUTPUT INSERTED.PackageID
                VALUES (@Name,@Description,@AdultPrice,@ChildPrice,@SeniorPrice,@IsMostPopular,@Features,@SortOrder)
            `);
        res.status(201).json({ packageId: result.recordset[0].PackageID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/ticket-packages/:id
router.put('/:id', async (req, res) => {
    const { name, description, adultPrice, childPrice, seniorPrice, isMostPopular, features, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id',            sql.Int,            parseInt(req.params.id, 10))
            .input('Name',          sql.NVarChar(100),  name)
            .input('Description',   sql.NVarChar(500),  description || null)
            .input('AdultPrice',    sql.Decimal(10,2),  adultPrice  || 0)
            .input('ChildPrice',    sql.Decimal(10,2),  childPrice  || 0)
            .input('SeniorPrice',   sql.Decimal(10,2),  seniorPrice || 0)
            .input('IsMostPopular', sql.Bit,            isMostPopular ? 1 : 0)
            .input('Features',      sql.NVarChar(sql.MAX), JSON.stringify(features || []))
            .input('SortOrder',     sql.Int,            sortOrder   || 0)
            .query(`
                UPDATE TicketPackage SET
                  Name=@Name, Description=@Description,
                  AdultPrice=@AdultPrice, ChildPrice=@ChildPrice, SeniorPrice=@SeniorPrice,
                  IsMostPopular=@IsMostPopular, Features=@Features, SortOrder=@SortOrder,
                  UpdatedAt=SYSUTCDATETIME()
                WHERE PackageID=@id AND DeletedAt IS NULL
            `);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/ticket-packages/:id
router.delete('/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query(`UPDATE TicketPackage SET DeletedAt=SYSUTCDATETIME() WHERE PackageID=@id`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
