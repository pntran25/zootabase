const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { optionalAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure image directory exists
const imageDir = path.join(__dirname, '../../frontend/src/assets/images/Attractions_Images');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, imageDir),
    filename: (req, file, cb) => cb(null, 'attraction-' + Date.now() + path.extname(file.originalname)),
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
});

// GET all attractions
router.get('/api/attractions', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT *, CreatedBy, UpdatedBy FROM Attraction WHERE DeletedAt IS NULL');
        const mappedResult = result.recordset.map(row => ({
            id: row.AttractionID.toString(),
            name: row.AttractionName,
            type: row.AttractionType,
            location: row.LocationDesc,
            capacity: row.CapacityVisitors,
            status: row.ActiveFlag ? 'Open' : 'Closed',
            description: row.Description || '',
            hours: row.Hours || '',
            duration: row.Duration || '',
            ageGroup: row.AgeGroup || '',
            price: row.Price != null ? Number(row.Price) : 0,
            imageUrl: row.ImageUrl || '',
            createdBy: row.CreatedBy || null,
            updatedBy: row.UpdatedBy || null,
        }));
        res.json(mappedResult);
    } catch (error) {
        console.error('Error fetching attractions:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST new attraction
router.post('/api/attractions', optionalAuth, async (req, res) => {
    try {
        const { name, type, location, capacity, status, description, hours, duration, ageGroup, price } = req.body;
        const activeFlag = status === 'Open' ? 1 : 0;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        const pool = await connectToDb();
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('type', sql.NVarChar, type)
            .input('location', sql.NVarChar, location)
            .input('capacity', sql.Int, parseInt(capacity || 0, 10))
            .input('activeFlag', sql.Bit, activeFlag)
            .input('description', sql.NVarChar, description || '')
            .input('hours', sql.NVarChar, hours || '')
            .input('duration', sql.NVarChar, duration || '')
            .input('ageGroup', sql.NVarChar, ageGroup || '')
            .input('price', sql.Decimal(10, 2), parseFloat(price || 0))
            .input('createdBy', sql.NVarChar, adminName)
            .query(`
                DECLARE @Out TABLE (AttractionID INT);
                INSERT INTO Attraction (AttractionName, AttractionType, LocationDesc, CapacityVisitors, ActiveFlag, Description, Hours, Duration, AgeGroup, Price, CreatedBy)
                OUTPUT INSERTED.AttractionID INTO @Out
                VALUES (@name, @type, @location, @capacity, @activeFlag, @description, @hours, @duration, @ageGroup, @price, @createdBy);
                SELECT AttractionID FROM @Out;
            `);
        res.status(201).json({ id: result.recordset[0].AttractionID.toString(), ...req.body });
    } catch (error) {
        console.error('Error creating attraction:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update attraction
router.put('/api/attractions/:id', optionalAuth, async (req, res) => {
    try {
        const { name, type, location, capacity, status, description, hours, duration, ageGroup, price } = req.body;
        const activeFlag = status === 'Open' ? 1 : 0;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('name', sql.NVarChar, name)
            .input('type', sql.NVarChar, type)
            .input('location', sql.NVarChar, location)
            .input('capacity', sql.Int, parseInt(capacity || 0, 10))
            .input('activeFlag', sql.Bit, activeFlag)
            .input('description', sql.NVarChar, description || '')
            .input('hours', sql.NVarChar, hours || '')
            .input('duration', sql.NVarChar, duration || '')
            .input('ageGroup', sql.NVarChar, ageGroup || '')
            .input('price', sql.Decimal(10, 2), parseFloat(price || 0))
            .input('updatedBy', sql.NVarChar, adminName)
            .query(`
                UPDATE Attraction
                SET AttractionName = @name, AttractionType = @type, LocationDesc = @location,
                    CapacityVisitors = @capacity, ActiveFlag = @activeFlag, UpdatedAt = SYSUTCDATETIME(),
                    Description = @description, Hours = @hours, Duration = @duration,
                    AgeGroup = @ageGroup, Price = @price, UpdatedBy = @updatedBy
                WHERE AttractionID = @id
            `);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating attraction:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST upload image
router.post('/api/attractions/:id/image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image file provided' });
        const pool = await connectToDb();
        const imageUrl = '/images/Attractions_Images/' + req.file.filename;
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('imageUrl', sql.NVarChar, imageUrl)
            .query('UPDATE Attraction SET ImageUrl = @imageUrl, UpdatedAt = SYSUTCDATETIME() WHERE AttractionID = @id');
        res.json({ message: 'Image uploaded successfully', imageUrl });
    } catch (err) {
        console.error('Error uploading attraction image:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE attraction (soft delete)
router.delete('/api/attractions/:id', optionalAuth, async (req, res) => {
    try {
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('deletedBy', sql.NVarChar, adminName)
            .query('UPDATE Attraction SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE AttractionID = @id');
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting attraction:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
