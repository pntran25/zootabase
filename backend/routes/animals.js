const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
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
const upload = multer({ storage: storage });

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
        res.status(500).json({ error: 'Failed to fetch animals' });
    }
});

// POST new animal
router.post('/', async (req, res) => {
    try {
        const { name, species, age, gender, diet, health, dateArrived, exhibit, lifespan, weight, region, funFact } = req.body;
        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            const habitatId = await resolveHabitatId(request, exhibit);

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
                .query(`
                    DECLARE @AnimOut TABLE (id INT, imageUrl NVARCHAR(255));
                    
                    INSERT INTO Animal (Name, Species, Age, Gender, Diet, HealthStatus, DateArrived, HabitatID, Lifespan, Weight, Region, FunFact)
                    OUTPUT INSERTED.AnimalID, INSERTED.ImageUrl INTO @AnimOut
                    VALUES (@name, @species, @age, @gender, @diet, @health, @dateArrived, @habitatId, @lifespan, @weight, @region, @funFact);
                    
                    SELECT id, imageUrl FROM @AnimOut;
                `);

            await transaction.commit();
            res.status(201).json({ 
                id: result.recordset[0].id, 
                name, species, age, gender, diet, health, dateArrived, exhibit,
                lifespan, weight, region, funFact,
                imageUrl: result.recordset[0].imageUrl
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error creating animal:', error);
        res.status(500).json({ error: 'Failed to create animal' });
    }
});

// PUT update animal
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, species, age, gender, diet, health, dateArrived, exhibit, lifespan, weight, region, funFact } = req.body;
        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            const habitatId = await resolveHabitatId(request, exhibit);

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
                .query(`
                    UPDATE Animal
                    SET Name = @name, Species = @species, Age = @age, Gender = @gender, 
                        Diet = @diet, HealthStatus = @health, DateArrived = @dateArrived, 
                        HabitatID = @habitatId, Lifespan = @lifespan, Weight = @weight,
                        Region = @region, FunFact = @funFact, UpdatedAt = SYSUTCDATETIME()
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
        res.status(500).json({ error: 'Failed to update animal' });
    }
});

// DELETE delete animal
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE Animal SET DeletedAt = SYSUTCDATETIME() WHERE AnimalID = @id');
        
        res.json({ message: 'Animal deleted successfully' });
    } catch (error) {
        console.error('Error deleting animal:', error);
        res.status(500).json({ error: 'Failed to delete animal' });
    }
});

// POST upload image
router.post('/:id/image', upload.single('image'), async (req, res) => {
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
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

module.exports = router;
