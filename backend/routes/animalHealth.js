const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');

/* ── Helper: derive HealthStatus from score ───────────────────────── */
function healthStatusFromScore(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Critical';
}

// ── GET all health records (joined with Animal + Staff) ─────────────
router.get('/records', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT r.RecordID, r.AnimalID, r.CheckupDate, r.HealthScore, r.Notes, r.StaffID,
                   a.Name AS AnimalName, a.Species,
                   s.FullName AS StaffName
            FROM AnimalHealthRecord r
            JOIN Animal a ON r.AnimalID = a.AnimalID
            LEFT JOIN Staff s ON r.StaffID = s.StaffID
            WHERE r.DeletedAt IS NULL AND a.DeletedAt IS NULL
            ORDER BY r.CheckupDate DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching health records:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── GET health records for a specific animal ────────────────────────
router.get('/records/animal/:animalId', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('animalId', sql.Int, parseInt(req.params.animalId, 10))
            .query(`
                SELECT r.RecordID, r.AnimalID, r.CheckupDate, r.HealthScore, r.Notes, r.StaffID,
                       s.FullName AS StaffName
                FROM AnimalHealthRecord r
                LEFT JOIN Staff s ON r.StaffID = s.StaffID
                WHERE r.AnimalID = @animalId AND r.DeletedAt IS NULL
                ORDER BY r.CheckupDate DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching health records for animal:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── POST create health record ───────────────────────────────────────
router.post('/records', verifyToken, async (req, res) => {
    try {
        const { AnimalID, CheckupDate, HealthScore, Notes, StaffID } = req.body;
        if (!AnimalID || !CheckupDate || HealthScore == null || !StaffID) {
            return res.status(400).json({ error: 'AnimalID, CheckupDate, HealthScore, and StaffID are required.' });
        }
        const score = parseInt(HealthScore, 10);
        if (score < 0 || score > 100) {
            return res.status(400).json({ error: 'HealthScore must be between 0 and 100.' });
        }
        const pool = await connectToDb();
        const result = await pool.request()
            .input('animalId', sql.Int, parseInt(AnimalID, 10))
            .input('checkupDate', sql.DateTime2, new Date(CheckupDate))
            .input('healthScore', sql.Int, score)
            .input('notes', sql.NVarChar(1000), Notes || null)
            .input('staffId', sql.Int, parseInt(StaffID, 10))
            .input('createdBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`
                INSERT INTO AnimalHealthRecord (AnimalID, CheckupDate, HealthScore, Notes, StaffID, CreatedAt, CreatedBy)
                OUTPUT INSERTED.RecordID
                VALUES (@animalId, @checkupDate, @healthScore, @notes, @staffId, SYSUTCDATETIME(), @createdBy)
            `);
        // Sync Animal.HealthStatus based on the new score
        await pool.request()
            .input('aid', sql.Int, parseInt(AnimalID, 10))
            .input('status', sql.NVarChar(50), healthStatusFromScore(score))
            .query(`UPDATE Animal SET HealthStatus = @status WHERE AnimalID = @aid`);
        res.status(201).json({ RecordID: result.recordset[0].RecordID, ...req.body });
    } catch (error) {
        console.error('Error creating health record:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── PUT update health record ────────────────────────────────────────
router.put('/records/:id', verifyToken, async (req, res) => {
    try {
        const { AnimalID, CheckupDate, HealthScore, Notes, StaffID } = req.body;
        const score = parseInt(HealthScore, 10);
        if (score < 0 || score > 100) {
            return res.status(400).json({ error: 'HealthScore must be between 0 and 100.' });
        }
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('animalId', sql.Int, parseInt(AnimalID, 10))
            .input('checkupDate', sql.DateTime2, new Date(CheckupDate))
            .input('healthScore', sql.Int, score)
            .input('notes', sql.NVarChar(1000), Notes || null)
            .input('staffId', sql.Int, parseInt(StaffID, 10))
            .input('updatedBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`
                UPDATE AnimalHealthRecord
                SET AnimalID = @animalId, CheckupDate = @checkupDate, HealthScore = @healthScore,
                    Notes = @notes, StaffID = @staffId, UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
                WHERE RecordID = @id AND DeletedAt IS NULL
            `);
        // Sync Animal.HealthStatus based on the updated score
        await pool.request()
            .input('aid', sql.Int, parseInt(AnimalID, 10))
            .input('status', sql.NVarChar(50), healthStatusFromScore(score))
            .query(`UPDATE Animal SET HealthStatus = @status WHERE AnimalID = @aid`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating health record:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── DELETE (soft) health record ─────────────────────────────────────
router.delete('/records/:id', verifyToken, async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('deletedBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`UPDATE AnimalHealthRecord SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE RecordID = @id`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting health record:', error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// HEALTH METRICS
// ═══════════════════════════════════════════════════════════════════

// ── GET all health metrics ──────────────────────────────────────────
router.get('/metrics', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT m.MetricID, m.AnimalID, m.RecordDate, m.ActivityLevel, m.Weight,
                   m.WeightRangeLow, m.WeightRangeHigh, m.MedicalConditions,
                   m.RecentTreatments, m.AppetiteStatus, m.Notes,
                   a.Name AS AnimalName, a.Species
            FROM AnimalHealthMetrics m
            JOIN Animal a ON m.AnimalID = a.AnimalID
            WHERE m.DeletedAt IS NULL AND a.DeletedAt IS NULL
            ORDER BY m.RecordDate DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching health metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── GET metrics for a specific animal ───────────────────────────────
router.get('/metrics/animal/:animalId', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('animalId', sql.Int, parseInt(req.params.animalId, 10))
            .query(`
                SELECT m.*
                FROM AnimalHealthMetrics m
                WHERE m.AnimalID = @animalId AND m.DeletedAt IS NULL
                ORDER BY m.RecordDate DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching metrics for animal:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── POST create health metric ───────────────────────────────────────
router.post('/metrics', verifyToken, async (req, res) => {
    try {
        const { AnimalID, RecordDate, ActivityLevel, Weight, WeightRangeLow, WeightRangeHigh,
                MedicalConditions, RecentTreatments, AppetiteStatus, Notes } = req.body;
        if (!AnimalID || !RecordDate) {
            return res.status(400).json({ error: 'AnimalID and RecordDate are required.' });
        }
        const pool = await connectToDb();
        const result = await pool.request()
            .input('animalId', sql.Int, parseInt(AnimalID, 10))
            .input('recordDate', sql.DateTime2, new Date(RecordDate))
            .input('activityLevel', sql.NVarChar(50), ActivityLevel || null)
            .input('weight', sql.Decimal(8, 2), Weight || null)
            .input('weightRangeLow', sql.Decimal(8, 2), WeightRangeLow || null)
            .input('weightRangeHigh', sql.Decimal(8, 2), WeightRangeHigh || null)
            .input('medicalConditions', sql.NVarChar(255), MedicalConditions || null)
            .input('recentTreatments', sql.NVarChar(255), RecentTreatments || null)
            .input('appetiteStatus', sql.NVarChar(50), AppetiteStatus || null)
            .input('notes', sql.NVarChar(1000), Notes || null)
            .input('createdBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`
                INSERT INTO AnimalHealthMetrics
                    (AnimalID, RecordDate, ActivityLevel, Weight, WeightRangeLow, WeightRangeHigh,
                     MedicalConditions, RecentTreatments, AppetiteStatus, Notes, CreatedAt, CreatedBy)
                OUTPUT INSERTED.MetricID
                VALUES (@animalId, @recordDate, @activityLevel, @weight, @weightRangeLow, @weightRangeHigh,
                        @medicalConditions, @recentTreatments, @appetiteStatus, @notes, SYSUTCDATETIME(), @createdBy)
            `);
        res.status(201).json({ MetricID: result.recordset[0].MetricID, ...req.body });
    } catch (error) {
        console.error('Error creating health metric:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── PUT update health metric ────────────────────────────────────────
router.put('/metrics/:id', verifyToken, async (req, res) => {
    try {
        const { AnimalID, RecordDate, ActivityLevel, Weight, WeightRangeLow, WeightRangeHigh,
                MedicalConditions, RecentTreatments, AppetiteStatus, Notes } = req.body;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('animalId', sql.Int, parseInt(AnimalID, 10))
            .input('recordDate', sql.DateTime2, new Date(RecordDate))
            .input('activityLevel', sql.NVarChar(50), ActivityLevel || null)
            .input('weight', sql.Decimal(8, 2), Weight || null)
            .input('weightRangeLow', sql.Decimal(8, 2), WeightRangeLow || null)
            .input('weightRangeHigh', sql.Decimal(8, 2), WeightRangeHigh || null)
            .input('medicalConditions', sql.NVarChar(255), MedicalConditions || null)
            .input('recentTreatments', sql.NVarChar(255), RecentTreatments || null)
            .input('appetiteStatus', sql.NVarChar(50), AppetiteStatus || null)
            .input('notes', sql.NVarChar(1000), Notes || null)
            .input('updatedBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`
                UPDATE AnimalHealthMetrics
                SET AnimalID = @animalId, RecordDate = @recordDate, ActivityLevel = @activityLevel,
                    Weight = @weight, WeightRangeLow = @weightRangeLow, WeightRangeHigh = @weightRangeHigh,
                    MedicalConditions = @medicalConditions, RecentTreatments = @recentTreatments,
                    AppetiteStatus = @appetiteStatus, Notes = @notes,
                    UpdatedAt = SYSUTCDATETIME(), UpdatedBy = @updatedBy
                WHERE MetricID = @id AND DeletedAt IS NULL
            `);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating health metric:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── DELETE (soft) health metric ─────────────────────────────────────
router.delete('/metrics/:id', verifyToken, async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('deletedBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(`UPDATE AnimalHealthMetrics SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE MetricID = @id`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting health metric:', error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// HEALTH ALERTS  (flagged by triggers or weight out-of-range)
// ═══════════════════════════════════════════════════════════════════
router.get('/alerts', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT ha.AlertID, ha.AnimalID, ha.AlertType, ha.AlertMessage, ha.CreatedAt, ha.IsResolved,
                   a.Name AS AnimalName, a.Species
            FROM HealthAlert ha
            JOIN Animal a ON ha.AnimalID = a.AnimalID
            WHERE a.DeletedAt IS NULL
            ORDER BY ha.CreatedAt DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        // Table may not exist yet — return empty
        if (error.message && error.message.includes('Invalid object name')) {
            return res.json([]);
        }
        console.error('Error fetching health alerts:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── Resolve an alert ────────────────────────────────────────────────
router.put('/alerts/:id/resolve', verifyToken, async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query(`UPDATE HealthAlert SET IsResolved = 1, ResolvedAt = SYSUTCDATETIME() WHERE AlertID = @id`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// COMPREHENSIVE ANIMAL REPORT (all data for a single animal)
// ═══════════════════════════════════════════════════════════════════
router.get('/report/:animalId', async (req, res) => {
    try {
        const animalId = parseInt(req.params.animalId, 10);
        const pool = await connectToDb();

        // Animal base info
        const animalResult = await pool.request()
            .input('id', sql.Int, animalId)
            .query(`
                SELECT a.*, h.HabitatType, h.Size AS HabitatSize, e.ExhibitName, ar.AreaName
                FROM Animal a
                LEFT JOIN Habitat h ON a.HabitatID = h.HabitatID
                LEFT JOIN Exhibit e ON h.ExhibitID = e.ExhibitID
                LEFT JOIN Area ar ON e.AreaID = ar.AreaID
                WHERE a.AnimalID = @id AND a.DeletedAt IS NULL
            `);
        if (animalResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Animal not found.' });
        }
        const animal = animalResult.recordset[0];

        // Health records
        const healthRecords = await pool.request()
            .input('id2', sql.Int, animalId)
            .query(`
                SELECT r.*, s.FullName AS StaffName
                FROM AnimalHealthRecord r
                LEFT JOIN Staff s ON r.StaffID = s.StaffID
                WHERE r.AnimalID = @id2 AND r.DeletedAt IS NULL
                ORDER BY r.CheckupDate DESC
            `);

        // Health metrics
        const healthMetrics = await pool.request()
            .input('id3', sql.Int, animalId)
            .query(`
                SELECT * FROM AnimalHealthMetrics
                WHERE AnimalID = @id3 AND DeletedAt IS NULL
                ORDER BY RecordDate DESC
            `);

        // Keeper assignments
        const keepers = await pool.request()
            .input('id4', sql.Int, animalId)
            .query(`
                SELECT ka.*, s.FullName AS KeeperName, s.Role
                FROM AnimalKeeperAssignment ka
                JOIN Staff s ON ka.StaffID = s.StaffID
                WHERE ka.AnimalID = @id4 AND ka.DeletedAt IS NULL
                ORDER BY ka.StartDate DESC
            `);

        // Feeding schedules
        let feedings = [];
        try {
            const feedResult = await pool.request()
                .input('id5', sql.Int, animalId)
                .query(`
                    SELECT fs.*, s.FullName AS StaffName
                    FROM FeedingSchedule fs
                    LEFT JOIN Staff s ON fs.StaffID = s.StaffID
                    WHERE fs.AnimalID = @id5 AND fs.DeletedAt IS NULL
                    ORDER BY fs.FeedTime
                `);
            feedings = feedResult.recordset;
        } catch { /* table may not exist */ }

        // Health alerts
        let alerts = [];
        try {
            const alertResult = await pool.request()
                .input('id6', sql.Int, animalId)
                .query(`
                    SELECT * FROM HealthAlert WHERE AnimalID = @id6 ORDER BY CreatedAt DESC
                `);
            alerts = alertResult.recordset;
        } catch { /* table may not exist */ }

        res.json({
            animal,
            healthRecords: healthRecords.recordset,
            healthMetrics: healthMetrics.recordset,
            keepers: keepers.recordset,
            feedings,
            alerts,
        });
    } catch (error) {
        console.error('Error building animal report:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── GET all animals (lightweight, for dropdowns) ────────────────────
router.get('/animals-list', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT AnimalID, Name, Species FROM Animal WHERE DeletedAt IS NULL ORDER BY Name
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching animals list:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── GET all staff (lightweight, for dropdowns) ──────────────────────
router.get('/staff-list', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT StaffID, FullName, Role FROM Staff WHERE DeletedAt IS NULL ORDER BY FullName
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching staff list:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
