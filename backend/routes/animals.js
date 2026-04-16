const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { optionalAuth, verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Q = require('../queries/animalQueries');

// Ensure image directory exists – use UPLOADS_DIR env var on Azure
const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
const imageDir = path.join(uploadsRoot, 'Animals_Images');
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
    limits: { fileSize: 20 * 1024 * 1024 }, // Increased to 20MB
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
        .query(Q.findHabitat);
    if (habRes.recordset.length > 0) {
        return habRes.recordset[0].HabitatID;
    }

    // Try to find the Exhibit, to add a Habitat to it
    const exhRes = await request
        .query(Q.findExhibit);
    let exhibitId;

    if (exhRes.recordset.length > 0) {
        exhibitId = exhRes.recordset[0].ExhibitID;
    } else {
        // Create an Area -> Exhibit -> Habitat chain
        const areaRes = await request.query(Q.ensureGeneralArea);
        const areaId = areaRes.recordset[0].AreaID;

        const newExhRes = await request
            .input('newExhName', sql.NVarChar, exhibitName)
            .input('areaId', sql.Int, areaId)
            .query(Q.createExhibit);
        exhibitId = newExhRes.recordset[0].ExhibitID;
    }

    // Create Habitat for Exhibit
    const newHabRes = await request
        .input('exhibitId', sql.Int, exhibitId)
        .query(Q.createHabitat);
    return newHabRes.recordset[0].HabitatID;
}

// GET all animals
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();
        const displayOnly = req.query.displayOnly === 'true';
        const result = await pool.request().query(Q.getAll(displayOnly));
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching animals:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST new animal
router.post('/', optionalAuth, async (req, res) => {
    try {
        const { name, species, speciesDetail, age, gender, diet, health, dateArrived, exhibit, lifespan, weight, region, funFact, isEndangered, isDisplay, codeSuffix } = req.body;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
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
                .query(Q.incrementSpeciesCode);
            if (scRes.recordset.length) {
                const { CodeSuffix, LastCount } = scRes.recordset[0];
                animalCode = `${CodeSuffix}-${String(LastCount).padStart(5, '0')}`;
            } else if (codeSuffix) {
                const cs = codeSuffix.trim().toLowerCase();
                await request
                    .input('newSn', sql.NVarChar, species)
                    .input('newCs', sql.NVarChar, cs)
                    .query(Q.insertSpeciesCode);
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
                .input('isDisplay', sql.Bit, isDisplay ? 1 : 0)
                .input('animalCode', sql.NVarChar, animalCode)
                .input('speciesDetail', sql.NVarChar, speciesDetail || null)
                .input('createdBy', sql.NVarChar, adminName)
                .query(Q.insertAnimal);

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
router.put('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, species, speciesDetail, age, gender, diet, health, dateArrived, exhibit, lifespan, weight, region, funFact, isEndangered, isDisplay } = req.body;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            const habitatId = (exhibit && exhibit !== 'Undecided')
                ? await resolveHabitatId(request, exhibit)
                : null;

            // Check if this animal already has an AnimalCode
            const codeCheck = await new sql.Request(transaction)
                .input('cid', sql.Int, id)
                .query(Q.getAnimalCode);
            const existingCode = codeCheck.recordset[0]?.AnimalCode;

            // Auto-assign AnimalCode if missing
            let animalCode = existingCode || null;
            if (!animalCode && species) {
                const scReq = new sql.Request(transaction);
                const scRes = await scReq
                    .input('speciesLookup', sql.NVarChar, species)
                    .query(Q.incrementSpeciesCode);
                if (scRes.recordset.length) {
                    const { CodeSuffix, LastCount } = scRes.recordset[0];
                    animalCode = `${CodeSuffix}-${String(LastCount).padStart(5, '0')}`;
                }
            }

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
                .input('isDisplay', sql.Bit, isDisplay ? 1 : 0)
                .input('speciesDetail', sql.NVarChar, speciesDetail || null)
                .input('updatedBy', sql.NVarChar, adminName)
                .input('animalCode', sql.NVarChar, animalCode)
                .query(Q.updateAnimal);

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
            .query(Q.patchEndangered);
        res.json({ message: 'Endangered status updated' });
    } catch (error) {
        console.error('Error updating endangered status:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE delete animal (soft-delete with departure reason)
router.delete('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const reason = (req.body && req.body.reason) || 'Other';
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, id)
            .input('reason', sql.NVarChar, reason)
            .input('deletedBy', sql.NVarChar, adminName)
            .query(Q.deleteAnimal);
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
            .query(Q.updateAnimalImage);

        res.json({ message: 'Image uploaded successfully', ImageUrl: imageUrl });
    } catch (err) {
        console.error('Error uploading image:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
