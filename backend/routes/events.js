const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const imageDir = path.join(__dirname, '../../frontend/src/assets/images/Event_Images');
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, imageDir),
    filename: (req, file, cb) => cb(null, 'event-' + Date.now() + path.extname(file.originalname)),
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

// Helper to resolve or create Exhibit based on name
async function resolveOrCreateExhibit(request, exhibitName) {
    // Try to find existing
    const exhRes = await request
        .input('exhName', sql.NVarChar, exhibitName)
        .query('SELECT ExhibitID FROM Exhibit WHERE ExhibitName = @exhName');
    
    if (exhRes.recordset.length > 0) {
        return exhRes.recordset[0].ExhibitID;
    }

    // Create an Area -> Exhibit chain if missing
    const areaRes = await request.query(`
        IF NOT EXISTS (SELECT 1 FROM Area WHERE AreaName = 'Events Space')
        BEGIN
            DECLARE @AreaOut TABLE (AreaID INT);
            INSERT INTO Area (AreaName) OUTPUT INSERTED.AreaID INTO @AreaOut VALUES ('Events Space');
            SELECT AreaID FROM @AreaOut;
        END
        ELSE
        BEGIN
            SELECT AreaID FROM Area WHERE AreaName = 'Events Space';
        END
    `);
    const areaId = areaRes.recordset[0].AreaID;

    const newExhRes = await request
        .input('newExhName', sql.NVarChar, exhibitName)
        .input('areaId', sql.Int, areaId)
        .query(`
            DECLARE @ExhOut TABLE (ExhibitID INT);
            INSERT INTO Exhibit (ExhibitName, AreaID, Capacity, OpeningHours)
            OUTPUT INSERTED.ExhibitID INTO @ExhOut
            VALUES (@newExhName, @areaId, 250, '09:00-17:00');
            SELECT ExhibitID FROM @ExhOut;
        `);
    return newExhRes.recordset[0].ExhibitID;
}

// GET all events
router.get('/api/events', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT e.*, ex.ExhibitName
            FROM Event e
            LEFT JOIN Exhibit ex ON e.ExhibitID = ex.ExhibitID
            WHERE e.DeletedAt IS NULL
        `);
        
        const mappedResult = result.recordset.map(row => {
            // Format times removing seconds (e.g. '10:30:00' -> '10:30')
            let sTime = row.StartTime ? row.StartTime.toISOString().substring(11, 16) : '';
            let eTime = row.EndTime ? row.EndTime.toISOString().substring(11, 16) : '';
            // If they are returned as strings (depends on tedious config), handle it
            if (typeof row.StartTime === 'string') sTime = row.StartTime.substring(0, 5);
            if (typeof row.EndTime === 'string') eTime = row.EndTime.substring(0, 5);

            return {
                id: row.EventID.toString(),
                name: row.EventName,
                date: row.EventDate ? row.EventDate.toISOString().split('T')[0] : '',
                endDate: row.EndDate ? row.EndDate.toISOString().split('T')[0] : '',
                imageUrl: row.ImageUrl || null,
                startTime: sTime,
                endTime: eTime,
                exhibit: row.ExhibitName || 'Unknown Location',
                capacity: row.Capacity,
                description: row.Description || '',
                category: row.Category || '',
                isFeatured: row.IsFeatured === true || row.IsFeatured === 1,
                price: row.Price || 0,
            };
        });
        
        res.json(mappedResult);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST new event
router.post('/api/events', verifyToken, async (req, res) => {
    try {
        let { name, date, endDate, startTime, endTime, exhibit, capacity, description, category, isFeatured, price } = req.body;

        // Ensure time has seconds for SQL TIME(0) format
        if (startTime.length === 5) startTime += ':00';
        if (endTime.length === 5) endTime += ':00';

        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            const exhibitId = await getOrCreateExhibitId(request, exhibit);

            const result = await request
                .input('name', sql.NVarChar, name)
                .input('date', sql.Date, date)
                .input('endDate', sql.Date, endDate || null)
                .input('startTime', sql.NVarChar, startTime)
                .input('endTime', sql.NVarChar, endTime)
                .input('exhId', sql.Int, exhibitId)
                .input('capacity', sql.Int, parseInt(capacity, 10))
                .input('description', sql.NVarChar, description || '')
                .input('category', sql.NVarChar, category || '')
                .input('isFeatured', sql.Bit, isFeatured ? 1 : 0)
                .input('price', sql.Decimal(10, 2), parseFloat(price || 0))
                .query(`
                    DECLARE @Out TABLE (id INT);
                    INSERT INTO Event (EventName, EventDate, EndDate, StartTime, EndTime, ExhibitID, Capacity, Description, Category, IsFeatured, Price)
                    OUTPUT INSERTED.EventID INTO @Out
                    VALUES (@name, @date, @endDate, @startTime, @endTime, @exhId, @capacity, @description, @category, @isFeatured, @price);
                    SELECT id FROM @Out;
                `);

            await transaction.commit();
            res.status(201).json({ id: result.recordset[0].id.toString(), ...req.body });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update event
router.put('/api/events/:id', verifyToken, async (req, res) => {
    try {
        let { name, date, endDate, startTime, endTime, exhibit, capacity, description, category, isFeatured, price } = req.body;

        if (startTime.length === 5) startTime += ':00';
        if (endTime.length === 5) endTime += ':00';

        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            const exhibitId = await getOrCreateExhibitId(request, exhibit);

            await request
                .input('id', sql.Int, parseInt(req.params.id, 10))
                .input('name', sql.NVarChar, name)
                .input('date', sql.Date, date)
                .input('endDate', sql.Date, endDate || null)
                .input('startTime', sql.NVarChar, startTime)
                .input('endTime', sql.NVarChar, endTime)
                .input('exhId', sql.Int, exhibitId)
                .input('capacity', sql.Int, parseInt(capacity, 10))
                .input('description', sql.NVarChar, description || '')
                .input('category', sql.NVarChar, category || '')
                .input('isFeatured', sql.Bit, isFeatured ? 1 : 0)
                .input('price', sql.Decimal(10, 2), parseFloat(price || 0))
                .query(`
                    UPDATE Event
                    SET EventName = @name, EventDate = @date, EndDate = @endDate,
                        StartTime = @startTime, EndTime = @endTime, ExhibitID = @exhId,
                        Capacity = @capacity, Description = @description, Category = @category,
                        IsFeatured = @isFeatured, Price = @price,
                        UpdatedAt = SYSUTCDATETIME()
                    WHERE EventID = @id
                `);

            await transaction.commit();
            res.json({ success: true });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE event (soft delete)
router.delete('/api/events/:id', verifyToken, async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query('UPDATE Event SET DeletedAt = SYSUTCDATETIME() WHERE EventID = @id');
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST upload event image
router.post('/api/events/:id/image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image file provided' });
        const imageUrl = '/images/Event_Images/' + req.file.filename;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('imageUrl', sql.NVarChar, imageUrl)
            .query('UPDATE Event SET ImageUrl = @imageUrl WHERE EventID = @id');
        res.json({ message: 'Image uploaded successfully', imageUrl });
    } catch (error) {
        console.error('Error uploading event image:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
