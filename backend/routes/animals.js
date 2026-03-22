const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure image directory exists
const imageDir = path.join(__dirname, '../../frontend/src/assets/images/Animals_Images');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, imageDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'animal-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
});

// Helper to resolve HabitatID from Exhibit name
async function resolveHabitatId(request, exhibitName) {
    // Try to find existing Habitat matching the ExhibitName
    const habRes = await request
        .input('searchExhibit', sql.NVarChar, exhibitName)
        .query(`
            SELECT TOP 1 h.HabitatID
            FROM Habitat h
            JOIN Exhibit e ON h.ExhibitID = e.ExhibitID
            WHERE e.ExhibitName = @searchExhibit
        `);
    if (habRes.recordset.length > 0) {
        return habRes.recordset[0].HabitatID;
    }

    // Try to find the Exhibit, to add a Habitat to it
    const exhRes = await request
        .query(`SELECT TOP 1 ExhibitID FROM Exhibit WHERE ExhibitName = @searchExhibit`);
    let exhibitId;

    if (exhRes.recordset.length > 0) {
        exhibitId = exhRes.recordset[0].ExhibitID;
    } else {
        // Create an Area -> Exhibit -> Habitat chain
        const areaRes = await request.query(`
            IF NOT EXISTS (SELECT 1 FROM Area WHERE AreaName = 'General')
            BEGIN
                DECLARE @AreaOut TABLE (AreaID INT);
                INSERT INTO Area (AreaName) OUTPUT INSERTED.AreaID INTO @AreaOut VALUES ('General');
                SELECT AreaID FROM @AreaOut;
            END
            ELSE
            BEGIN
                SELECT AreaID FROM Area WHERE AreaName = 'General';
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
                VALUES (@newExhName, @areaId, 100, '09:00-17:00');
                SELECT ExhibitID FROM @ExhOut;
            `);
        exhibitId = newExhRes.recordset[0].ExhibitID;
    }

    // Create Habitat for Exhibit
    const newHabRes = await request
        .input('exhibitId', sql.Int, exhibitId)
        .query(`
            DECLARE @HabOut TABLE (HabitatID INT);
            INSERT INTO Habitat (HabitatType, Size, ExhibitID)
            OUTPUT INSERTED.HabitatID INTO @HabOut
            VALUES ('Standard', 100.0, @exhibitId);
            SELECT HabitatID FROM @HabOut;
        `);
    return newHabRes.recordset[0].HabitatID;
}

// GET all animals
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const query = `
            SELECT 
                a.AnimalID as id,
                a.Name as name,
                a.Species as species,
                a.Age as age,
                a.Gender as gender,
                a.Diet as diet,
                a.HealthStatus as health,
                a.DateArrived as dateArrived,
                a.ImageUrl as imageUrl,
                a.Lifespan as lifespan,
                a.Weight as weight,
                a.Region as region,
                a.FunFact as funFact,
                a.IsEndangered as isEndangered,
                a.AnimalCode as animalCode,
                a.SpeciesDetail as speciesDetail,
                h.HabitatType,
                e.ExhibitName as exhibit
            FROM Animal a
            LEFT JOIN Habitat h ON a.HabitatID = h.HabitatID
            LEFT JOIN Exhibit e ON h.ExhibitID = e.ExhibitID
            WHERE a.DeletedAt IS NULL
        `;
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching animals:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST new animal
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, species, speciesDetail, age, gender, diet, health, dateArrived, exhibit, lifespan, weight, region, funFact, isEndangered, codeSuffix } = req.body;
        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            const habitatId = (exhibit && exhibit !== 'Undecided')
                ? await resolveHabitatId(request, exhibit)
                : null;

            // Auto-assign AnimalCode from SpeciesCode registry
            let animalCode = null;
            const scRes = await request
                .input('speciesLookup', sql.NVarChar, species)
                .query(`
                    UPDATE SpeciesCode SET LastCount = LastCount + 1
                    OUTPUT INSERTED.CodeSuffix, INSERTED.LastCount
                    WHERE SpeciesName = @speciesLookup
                `);
            if (scRes.recordset.length) {
                const { CodeSuffix, LastCount } = scRes.recordset[0];
                animalCode = `${CodeSuffix}-${String(LastCount).padStart(5, '0')}`;
            } else if (codeSuffix) {
                const cs = codeSuffix.trim().toLowerCase();
                await request
                    .input('newSn', sql.NVarChar, species)
                    .input('newCs', sql.NVarChar, cs)
                    .query('INSERT INTO SpeciesCode (SpeciesName, CodeSuffix, LastCount) VALUES (@newSn, @newCs, 1)');
                animalCode = `${cs}-00001`;
            }

            const result = await request
                .input('name', sql.NVarChar, name)
                .input('species', sql.NVarChar, species)
                .input('age', sql.Int, parseInt(age) || 0)
                .input('gender', sql.NVarChar, gender)
                .input('diet', sql.NVarChar, diet)
                .input('health', sql.NVarChar, health)
                .input('dateArrived', sql.Date, dateArrived || new Date())
                .input('habitatId', sql.Int, habitatId)
                .input('lifespan', sql.NVarChar, lifespan || null)
                .input('weight', sql.NVarChar, weight || null)
                .input('region', sql.NVarChar, region || null)
                .input('funFact', sql.NVarChar, funFact || null)
                .input('isEndangered', sql.Bit, isEndangered ? 1 : 0)
                .input('animalCode', sql.NVarChar, animalCode)
                .input('speciesDetail', sql.NVarChar, speciesDetail || null)
                .query(`
                    DECLARE @AnimOut TABLE (id INT, imageUrl NVARCHAR(255));

                    INSERT INTO Animal (Name, Species, SpeciesDetail, Age, Gender, Diet, HealthStatus, DateArrived, HabitatID, Lifespan, Weight, Region, FunFact, IsEndangered, AnimalCode)
                    OUTPUT INSERTED.AnimalID, INSERTED.ImageUrl INTO @AnimOut
                    VALUES (@name, @species, @speciesDetail, @age, @gender, @diet, @health, @dateArrived, @habitatId, @lifespan, @weight, @region, @funFact, @isEndangered, @animalCode);

                    SELECT id, imageUrl FROM @AnimOut;
                `);

            await transaction.commit();
            res.status(201).json({
                id: result.recordset[0].id,
                animalCode,
                name, species, age, gender, diet, health, dateArrived, exhibit,
                lifespan, weight, region, funFact, isEndangered,
                imageUrl: result.recordset[0].imageUrl
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error creating animal:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update animal
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, species, speciesDetail, age, gender, diet, health, dateArrived, exhibit, lifespan, weight, region, funFact, isEndangered } = req.body;
        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            const habitatId = (exhibit && exhibit !== 'Undecided')
                ? await resolveHabitatId(request, exhibit)
                : null;

            await request
                .input('id', sql.Int, id)
                .input('name', sql.NVarChar, name)
                .input('species', sql.NVarChar, species)
                .input('age', sql.Int, parseInt(age) || 0)
                .input('gender', sql.NVarChar, gender)
                .input('diet', sql.NVarChar, diet)
                .input('health', sql.NVarChar, health)
                .input('dateArrived', sql.Date, dateArrived || new Date())
                .input('habitatId', sql.Int, habitatId)
                .input('lifespan', sql.NVarChar, lifespan || null)
                .input('weight', sql.NVarChar, weight || null)
                .input('region', sql.NVarChar, region || null)
                .input('funFact', sql.NVarChar, funFact || null)
                .input('isEndangered', sql.Bit, isEndangered ? 1 : 0)
                .input('speciesDetail', sql.NVarChar, speciesDetail || null)
                .query(`
                    UPDATE Animal
                    SET Name = @name, Species = @species, SpeciesDetail = @speciesDetail,
                        Age = @age, Gender = @gender,
                        Diet = @diet, HealthStatus = @health, DateArrived = @dateArrived,
                        HabitatID = @habitatId, Lifespan = @lifespan, Weight = @weight,
                        Region = @region, FunFact = @funFact, IsEndangered = @isEndangered,
                        UpdatedAt = SYSUTCDATETIME()
                    WHERE AnimalID = @id AND DeletedAt IS NULL
                `);

            await transaction.commit();
            res.json({ message: 'Animal updated successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error updating animal:', error);
        res.status(500).json({ error: error.message });
    }
});

// PATCH endangered flag only (simple, no transaction needed)
router.patch('/:id/endangered', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { isEndangered } = req.body;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, id)
            .input('isEndangered', sql.Bit, isEndangered ? 1 : 0)
            .query('UPDATE Animal SET IsEndangered = @isEndangered, UpdatedAt = SYSUTCDATETIME() WHERE AnimalID = @id AND DeletedAt IS NULL');
        res.json({ message: 'Endangered status updated' });
    } catch (error) {
        console.error('Error updating endangered status:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE delete animal (soft-delete with departure reason)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const reason = (req.body && req.body.reason) || 'Other';
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, id)
            .input('reason', sql.NVarChar, reason)
            .query('UPDATE Animal SET DeletedAt = SYSUTCDATETIME(), DepartureReason = @reason WHERE AnimalID = @id');
        res.json({ message: 'Animal removed successfully' });
    } catch (error) {
        console.error('Error removing animal:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST upload image
router.post('/:id/image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { id } = req.params;
        const imageUrl = '/images/Animals_Images/' + req.file.filename;

        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, id)
            .input('imageUrl', sql.NVarChar, imageUrl)
            .query(`
                UPDATE Animal 
                SET ImageUrl = @imageUrl, UpdatedAt = SYSUTCDATETIME()
                WHERE AnimalID = @id
            `);

        res.json({ message: 'Image uploaded successfully', ImageUrl: imageUrl });
    } catch (err) {
        console.error('Error uploading image:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
