const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure image directory exists
const imageDir = path.join(__dirname, '../../frontend/src/assets/images/Exhibits_Images');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, imageDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'exhibit-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// GET all exhibits
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT 
                e.ExhibitID, 
                e.ExhibitName, 
                e.Capacity, 
                e.OpeningHours, 
                e.ImageUrl,
                a.AreaName,
                h.HabitatType
            FROM Exhibit e
            LEFT JOIN Area a ON e.AreaID = a.AreaID
            LEFT JOIN Habitat h ON e.ExhibitID = h.ExhibitID
            WHERE e.DeletedAt IS NULL
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching exhibits:', err);
        res.status(500).json({ error: 'Failed to fetch exhibits' });
    }
});

// POST new exhibit
router.post('/', async (req, res) => {
    try {
        const { ExhibitName, AreaName, HabitatType, Capacity, OpeningHours } = req.body;
        const pool = await connectToDb();
        
        // Use a transaction since we might need to create an Area and a Habitat
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            // 1. Check if Area exists, if not create it
            let areaId;
            const areaResult = await request
                .input('paramAreaName', sql.NVarChar, AreaName)
                .query('SELECT AreaID FROM Area WHERE AreaName = @paramAreaName');
            
            if (areaResult.recordset.length > 0) {
                areaId = areaResult.recordset[0].AreaID;
            } else {
                const insertAreaResult = await request
                    .query('INSERT INTO Area (AreaName) OUTPUT INSERTED.AreaID VALUES (@paramAreaName)');
                areaId = insertAreaResult.recordset[0].AreaID;
            }

            // 2. Insert Exhibit
            const exhibitResult = await request
                .input('paramExhibitName', sql.NVarChar, ExhibitName)
                .input('paramAreaId', sql.Int, areaId)
                .input('paramCapacity', sql.Int, Capacity)
                .input('paramOpeningHours', sql.NVarChar, OpeningHours)
                .query(`
                    INSERT INTO Exhibit (ExhibitName, AreaID, Capacity, OpeningHours)
                    OUTPUT INSERTED.ExhibitID
                    VALUES (@paramExhibitName, @paramAreaId, @paramCapacity, @paramOpeningHours)
                `);
            const exhibitId = exhibitResult.recordset[0].ExhibitID;

            // 3. Insert Habitat if provided
            if (HabitatType) {
                await request
                    .input('paramHabitatType', sql.NVarChar, HabitatType)
                    .input('paramExhibitId', sql.Int, exhibitId)
                    .query(`
                        INSERT INTO Habitat (HabitatType, Size, ExhibitID)
                        VALUES (@paramHabitatType, 100.0, @paramExhibitId)
                    `); // Providing default Size of 100 for now, UI doesn't collect it.
            }

            await transaction.commit();
            res.status(201).json({ 
                ExhibitID: exhibitId, 
                ExhibitName, 
                AreaName, 
                Capacity, 
                OpeningHours,
                HabitatType 
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error('Error creating exhibit:', err);
        res.status(500).json({ error: 'Failed to create exhibit' });
    }
});

// PUT update exhibit
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ExhibitName, AreaName, HabitatType, Capacity, OpeningHours } = req.body;
        const pool = await connectToDb();
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            
            // 1. Manage Area
            let areaId;
            const areaResult = await request
                .input('paramAreaName', sql.NVarChar, AreaName)
                .query('SELECT AreaID FROM Area WHERE AreaName = @paramAreaName');
            
            if (areaResult.recordset.length > 0) {
                areaId = areaResult.recordset[0].AreaID;
            } else {
                const insertAreaResult = await request
                    .query('INSERT INTO Area (AreaName) OUTPUT INSERTED.AreaID VALUES (@paramAreaName)');
                areaId = insertAreaResult.recordset[0].AreaID;
            }

            // 2. Update Exhibit
            await request
                .input('paramId', sql.Int, id)
                .input('paramExhibitName', sql.NVarChar, ExhibitName)
                .input('paramAreaId', sql.Int, areaId)
                .input('paramCapacity', sql.Int, Capacity)
                .input('paramOpeningHours', sql.NVarChar, OpeningHours)
                .query(`
                    UPDATE Exhibit 
                    SET ExhibitName = @paramExhibitName, 
                        AreaID = @paramAreaId, 
                        Capacity = @paramCapacity, 
                        OpeningHours = @paramOpeningHours,
                        UpdatedAt = SYSUTCDATETIME()
                    WHERE ExhibitID = @paramId AND DeletedAt IS NULL
                `);

            // 3. Manage Habitat
            const habitatResult = await request
                .query('SELECT HabitatID FROM Habitat WHERE ExhibitID = @paramId');

            if (habitatResult.recordset.length > 0) {
                 await request
                    .input('paramHabitatType', sql.NVarChar, HabitatType)
                    .query(`
                        UPDATE Habitat 
                        SET HabitatType = @paramHabitatType, 
                            UpdatedAt = SYSUTCDATETIME()
                        WHERE ExhibitID = @paramId
                    `);
            } else if (HabitatType) {
                 await request
                    .input('paramHabitatType', sql.NVarChar, HabitatType)
                    .query(`
                        INSERT INTO Habitat (HabitatType, Size, ExhibitID)
                        VALUES (@paramHabitatType, 100.0, @paramId)
                    `);
            }

            await transaction.commit();
            res.json({ message: 'Exhibit updated successfully' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error('Error updating exhibit:', err);
        res.status(500).json({ error: 'Failed to update exhibit' });
    }
});

// DELETE delete exhibit (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE Exhibit SET DeletedAt = SYSUTCDATETIME() WHERE ExhibitID = @id');
        
        res.json({ message: 'Exhibit deleted successfully' });
    } catch (err) {
        console.error('Error deleting exhibit:', err);
        res.status(500).json({ error: 'Failed to delete exhibit' });
    }
});

// POST upload exhibit image
router.post('/:id/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { id } = req.params;
        const imageUrl = '/images/Exhibits_Images/' + req.file.filename;

        const pool = await connectToDb();
        await pool.request()
            .input('paramId', sql.Int, id)
            .input('paramImageUrl', sql.NVarChar, imageUrl)
            .query(`
                UPDATE Exhibit 
                SET ImageUrl = @paramImageUrl,
                    UpdatedAt = SYSUTCDATETIME()
                WHERE ExhibitID = @paramId
            `);

        res.json({ message: 'Image uploaded successfully', ImageUrl: imageUrl });
    } catch (err) {
        console.error('Error uploading image:', err);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

module.exports = router;
