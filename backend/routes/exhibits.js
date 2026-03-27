const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { optionalAuth, verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure image directory exists
const imageDir = process.env.NODE_ENV === "production" ? "/tmp/images/Exhibits_Images" : path.join(__dirname, '../../frontend/src/assets/images/Exhibits_Images');
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
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
});

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
                e.IsFeatured,
                e.Description,
                e.CreatedBy,
                e.UpdatedBy,
                a.AreaName,
                h.HabitatType,
                ISNULL(STUFF((
                    SELECT DISTINCT ',' + an.Species
                    FROM Animal an
                    JOIN Habitat ah ON an.HabitatID = ah.HabitatID
                    WHERE ah.ExhibitID = e.ExhibitID
                      AND an.DeletedAt IS NULL
                      AND an.Species IS NOT NULL
                    FOR XML PATH(''), TYPE
                ).value('.', 'NVARCHAR(MAX)'), 1, 1, ''), '') AS AnimalNames
            FROM Exhibit e
            LEFT JOIN Area a ON e.AreaID = a.AreaID
            LEFT JOIN Habitat h ON e.ExhibitID = h.ExhibitID
            WHERE e.DeletedAt IS NULL
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching exhibits:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST new exhibit
router.post('/', optionalAuth, async (req, res) => {
    try {
        const { ExhibitName, AreaName, HabitatType, Capacity, OpeningHours, Description } = req.body;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
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
                .input('paramDescription', sql.NVarChar(1000), Description || null)
                .input('paramCreatedBy', sql.NVarChar, adminName)
                .query(`
                    INSERT INTO Exhibit (ExhibitName, AreaID, Capacity, OpeningHours, Description, CreatedBy)
                    OUTPUT INSERTED.ExhibitID
                    VALUES (@paramExhibitName, @paramAreaId, @paramCapacity, @paramOpeningHours, @paramDescription, @paramCreatedBy)
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
        res.status(500).json({ error: err.message });
    }
});

// PUT update exhibit
router.put('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { ExhibitName, AreaName, HabitatType, Capacity, OpeningHours, Description } = req.body;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
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
                .input('paramDescription', sql.NVarChar(1000), Description || null)
                .input('paramUpdatedBy', sql.NVarChar, adminName)
                .query(`
                    UPDATE Exhibit
                    SET ExhibitName = @paramExhibitName,
                        AreaID = @paramAreaId,
                        Capacity = @paramCapacity,
                        OpeningHours = @paramOpeningHours,
                        Description = @paramDescription,
                        UpdatedAt = SYSUTCDATETIME(),
                        UpdatedBy = @paramUpdatedBy
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
        res.status(500).json({ error: err.message });
    }
});

// PATCH featured flag only
router.patch('/:id/featured', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { isFeatured } = req.body;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, id)
            .input('isFeatured', sql.Bit, isFeatured ? 1 : 0)
            .query('UPDATE Exhibit SET IsFeatured = @isFeatured, UpdatedAt = SYSUTCDATETIME() WHERE ExhibitID = @id AND DeletedAt IS NULL');
        res.json({ message: 'Featured status updated' });
    } catch (error) {
        console.error('Error updating featured status:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE delete exhibit (soft delete)
router.delete('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        const pool = await connectToDb();

        // Unlink any animals assigned to habitats under this exhibit
        await pool.request()
            .input('id', sql.Int, id)
            .query(`
                UPDATE Animal SET HabitatID = NULL
                WHERE DeletedAt IS NULL
                  AND HabitatID IN (
                    SELECT h.HabitatID FROM Habitat h WHERE h.ExhibitID = @id
                  )
            `);

        await pool.request()
            .input('id', sql.Int, id)
            .input('deletedBy', sql.NVarChar, adminName)
            .query('UPDATE Exhibit SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE ExhibitID = @id');

        res.json({ message: 'Exhibit deleted successfully' });
    } catch (err) {
        console.error('Error deleting exhibit:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST upload exhibit image
router.post('/:id/image', verifyToken, upload.single('image'), async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
