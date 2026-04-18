const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');
const Q = require('../queries/animalHealthQueries');

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
        const result = await pool.request().query(Q.getAllRecords);
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
            .query(Q.getRecordsByAnimal);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching health records for animal:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── POST create health record ───────────────────────────────────────
router.post('/records', verifyToken, async (req, res) => {
    try {
        const { AnimalID, CheckupDate, HealthScore, Notes, StaffID,
                ActivityLevel, Weight, WeightRangeLow, WeightRangeHigh,
                MedicalConditions, RecentTreatments, AppetiteStatus } = req.body;
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
            .input('activityLevel', sql.NVarChar(50), ActivityLevel || null)
            .input('weight', sql.Decimal(8, 2), Weight || null)
            .input('weightRangeLow', sql.Decimal(8, 2), WeightRangeLow || null)
            .input('weightRangeHigh', sql.Decimal(8, 2), WeightRangeHigh || null)
            .input('medicalConditions', sql.NVarChar(255), MedicalConditions || null)
            .input('recentTreatments', sql.NVarChar(255), RecentTreatments || null)
            .input('appetiteStatus', sql.NVarChar(50), AppetiteStatus || null)
            .input('createdBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(Q.insertRecord);
        // Sync Animal.HealthStatus based on the new score
        await pool.request()
            .input('aid', sql.Int, parseInt(AnimalID, 10))
            .input('status', sql.NVarChar(50), healthStatusFromScore(score))
            .query(Q.syncAnimalHealth);

        // Auto-create alert if weight is out of range (skip if unresolved alert already exists)
        const w = Weight != null ? parseFloat(Weight) : NaN;
        const lo = WeightRangeLow != null ? parseFloat(WeightRangeLow) : NaN;
        const hi = WeightRangeHigh != null ? parseFloat(WeightRangeHigh) : NaN;
        if (!isNaN(w) && ((!isNaN(lo) && w < lo) || (!isNaN(hi) && w > hi))) {
            try {
                const existing = await pool.request()
                    .input('chkAnimalId', sql.Int, parseInt(AnimalID, 10))
                    .input('chkType', sql.NVarChar(50), 'Weight Out of Range')
                    .query('SELECT 1 FROM HealthAlert WHERE AnimalID = @chkAnimalId AND AlertType = @chkType AND IsResolved = 0');
                if (existing.recordset.length === 0) {
                    const animalResult = await pool.request()
                        .input('lookupId', sql.Int, parseInt(AnimalID, 10))
                        .query('SELECT Name, Species FROM Animal WHERE AnimalID = @lookupId');
                    const animal = animalResult.recordset[0];
                    const animalLabel = animal ? `${animal.Name} (${animal.Species})` : `Animal #${AnimalID}`;
                    const direction = (!isNaN(lo) && w < lo) ? 'below' : 'above';
                    const rangeStr = direction === 'below'
                        ? `${w.toFixed(1)} kg is below the minimum of ${lo.toFixed(1)} kg`
                        : `${w.toFixed(1)} kg exceeds the maximum of ${hi.toFixed(1)} kg`;
                    await pool.request()
                        .input('alertAnimalId', sql.Int, parseInt(AnimalID, 10))
                        .input('alertType', sql.NVarChar(50), 'Weight Out of Range')
                        .input('alertMessage', sql.NVarChar(1000), `${animalLabel} weight is ${direction} expected range — ${rangeStr}. Review diet and activity.`)
                        .query(Q.insertAlert);
                }
            } catch (alertErr) {
                console.error('Failed to create weight alert:', alertErr);
            }
        }

        res.status(201).json({ RecordID: result.recordset[0].RecordID, ...req.body });
    } catch (error) {
        console.error('Error creating health record:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── PUT update health record ────────────────────────────────────────
router.put('/records/:id', verifyToken, async (req, res) => {
    try {
        const { AnimalID, CheckupDate, HealthScore, Notes, StaffID,
                ActivityLevel, Weight, WeightRangeLow, WeightRangeHigh,
                MedicalConditions, RecentTreatments, AppetiteStatus } = req.body;
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
            .input('activityLevel', sql.NVarChar(50), ActivityLevel || null)
            .input('weight', sql.Decimal(8, 2), Weight || null)
            .input('weightRangeLow', sql.Decimal(8, 2), WeightRangeLow || null)
            .input('weightRangeHigh', sql.Decimal(8, 2), WeightRangeHigh || null)
            .input('medicalConditions', sql.NVarChar(255), MedicalConditions || null)
            .input('recentTreatments', sql.NVarChar(255), RecentTreatments || null)
            .input('appetiteStatus', sql.NVarChar(50), AppetiteStatus || null)
            .input('updatedBy', sql.NVarChar(100), req.user?.email || 'system')
            .query(Q.updateRecord);
        // Sync Animal.HealthStatus based on the updated score
        await pool.request()
            .input('aid', sql.Int, parseInt(AnimalID, 10))
            .input('status', sql.NVarChar(50), healthStatusFromScore(score))
            .query(Q.syncAnimalHealth);

        // Auto-create alert if weight is out of range (skip if unresolved alert already exists)
        const w = Weight != null ? parseFloat(Weight) : NaN;
        const lo = WeightRangeLow != null ? parseFloat(WeightRangeLow) : NaN;
        const hi = WeightRangeHigh != null ? parseFloat(WeightRangeHigh) : NaN;
        if (!isNaN(w) && ((!isNaN(lo) && w < lo) || (!isNaN(hi) && w > hi))) {
            try {
                const existing = await pool.request()
                    .input('chkAnimalId', sql.Int, parseInt(AnimalID, 10))
                    .input('chkType', sql.NVarChar(50), 'Weight Out of Range')
                    .query('SELECT 1 FROM HealthAlert WHERE AnimalID = @chkAnimalId AND AlertType = @chkType AND IsResolved = 0');
                if (existing.recordset.length === 0) {
                    const animalResult = await pool.request()
                        .input('lookupId', sql.Int, parseInt(AnimalID, 10))
                        .query('SELECT Name, Species FROM Animal WHERE AnimalID = @lookupId');
                    const animal = animalResult.recordset[0];
                    const animalLabel = animal ? `${animal.Name} (${animal.Species})` : `Animal #${AnimalID}`;
                    const direction = (!isNaN(lo) && w < lo) ? 'below' : 'above';
                    const rangeStr = direction === 'below'
                        ? `${w.toFixed(1)} kg is below the minimum of ${lo.toFixed(1)} kg`
                        : `${w.toFixed(1)} kg exceeds the maximum of ${hi.toFixed(1)} kg`;
                    await pool.request()
                        .input('alertAnimalId', sql.Int, parseInt(AnimalID, 10))
                        .input('alertType', sql.NVarChar(50), 'Weight Out of Range')
                        .input('alertMessage', sql.NVarChar(1000), `${animalLabel} weight is ${direction} expected range — ${rangeStr}. Review diet and activity.`)
                        .query(Q.insertAlert);
                }
            } catch (alertErr) {
                console.error('Failed to create weight alert:', alertErr);
            }
        }

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
            .query(Q.deleteRecord);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting health record:', error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// HEALTH ALERTS  (flagged by triggers or weight out-of-range)
// ═══════════════════════════════════════════════════════════════════
router.get('/alerts', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(Q.getAllAlerts);
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
        const { ResolutionNotes } = req.body;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('notes', sql.NVarChar(1000), ResolutionNotes || null)
            .query(Q.resolveAlert);
        res.json({ success: true });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════════
// ANIMAL REPORT SUMMARY (distributions for overview charts)
// ═══════════════════════════════════════════════════════════════════
router.get('/animal-report-summary', async (req, res) => {
    try {
        const pool = await connectToDb();
        const { startDate, endDate } = req.query;
        const hasDateFilter = startDate && endDate;

        // --- Date-filtered queries (health records, alerts) ---
        let statsQuery, healthDistQuery, alertStatusQuery, recentAlertsQuery;

        if (hasDateFilter) {
            statsQuery = `
              SELECT
                (SELECT COUNT(*) FROM Animal WHERE DeletedAt IS NULL) AS TotalAnimals,
                (SELECT COUNT(*) FROM HealthAlert WHERE IsResolved = 0 AND CreatedAt >= @startDate AND CreatedAt < DATEADD(DAY, 1, CAST(@endDate AS DATE))) AS UnresolvedAlerts,
                (SELECT COUNT(*) FROM AnimalHealthRecord WHERE DeletedAt IS NULL AND CheckupDate >= @startDate AND CheckupDate < DATEADD(DAY, 1, CAST(@endDate AS DATE))) AS HealthCheckups,
                (SELECT AVG(CAST(HealthScore AS FLOAT)) FROM AnimalHealthRecord WHERE DeletedAt IS NULL AND CheckupDate >= @startDate AND CheckupDate < DATEADD(DAY, 1, CAST(@endDate AS DATE))) AS AvgHealthScore
            `;
            healthDistQuery = `
              SELECT
                CASE
                  WHEN HealthScore >= 90 THEN 'Excellent'
                  WHEN HealthScore >= 70 THEN 'Good'
                  WHEN HealthScore >= 50 THEN 'Fair'
                  ELSE 'Critical'
                END AS HealthStatus,
                COUNT(*) AS Count
              FROM AnimalHealthRecord
              WHERE DeletedAt IS NULL AND CheckupDate >= @startDate AND CheckupDate < DATEADD(DAY, 1, CAST(@endDate AS DATE))
              GROUP BY CASE
                  WHEN HealthScore >= 90 THEN 'Excellent'
                  WHEN HealthScore >= 70 THEN 'Good'
                  WHEN HealthScore >= 50 THEN 'Fair'
                  ELSE 'Critical'
                END
            `;
            alertStatusQuery = `
              SELECT
                SUM(CASE WHEN IsResolved = 0 THEN 1 ELSE 0 END) AS Active,
                SUM(CASE WHEN IsResolved = 1 THEN 1 ELSE 0 END) AS Resolved
              FROM HealthAlert ha
              JOIN Animal a ON ha.AnimalID = a.AnimalID
              WHERE a.DeletedAt IS NULL AND ha.CreatedAt >= @startDate AND ha.CreatedAt < DATEADD(DAY, 1, CAST(@endDate AS DATE))
            `;
            recentAlertsQuery = `
              SELECT TOP 10 ha.AlertID, ha.AlertType, ha.AlertMessage, ha.CreatedAt, ha.IsResolved,
                     a.Name AS AnimalName, a.Species
              FROM HealthAlert ha
              JOIN Animal a ON ha.AnimalID = a.AnimalID
              WHERE a.DeletedAt IS NULL AND ha.IsResolved = 0
                AND ha.CreatedAt >= @startDate AND ha.CreatedAt < DATEADD(DAY, 1, CAST(@endDate AS DATE))
              ORDER BY ha.CreatedAt DESC
            `;
        }

        // Build requests
        const makeReq = () => {
            const r = pool.request();
            if (hasDateFilter) {
                r.input('startDate', sql.Date, startDate);
                r.input('endDate', sql.Date, endDate);
            }
            return r;
        };

        const [stats, healthDist, speciesDist, exhibitDist, genderDist, endangeredDist, ageDist, recentAlerts, alertStatusDist] = await Promise.all([
            makeReq().query(hasDateFilter ? statsQuery : Q.healthReportStats),
            makeReq().query(hasDateFilter ? healthDistQuery : Q.summaryHealthDistribution),
            pool.request().query(Q.summarySpeciesDistribution),
            pool.request().query(Q.summaryExhibitDistribution),
            pool.request().query(Q.summaryGenderDistribution),
            pool.request().query(Q.summaryEndangeredDistribution),
            pool.request().query(Q.summaryAgeDistribution),
            makeReq().query(hasDateFilter ? recentAlertsQuery : Q.summaryRecentAlerts),
            makeReq().query(hasDateFilter ? alertStatusQuery : Q.summaryAlertStatusDistribution),
        ]);

        res.json({
            stats: stats.recordset[0],
            healthDistribution: healthDist.recordset,
            speciesDistribution: speciesDist.recordset,
            exhibitDistribution: exhibitDist.recordset,
            genderDistribution: genderDist.recordset,
            endangeredDistribution: endangeredDist.recordset[0],
            ageDistribution: ageDist.recordset,
            recentAlerts: recentAlerts.recordset,
            alertStatusDistribution: alertStatusDist.recordset[0],
        });
    } catch (error) {
        console.error('Error building animal report summary:', error);
        res.status(500).json({ error: error.message });
    }
});


// ═══════════════════════════════════════════════════════════════════
// AGGREGATE HEALTH REPORT (all animals, for the Health Report page)
// ═══════════════════════════════════════════════════════════════════
router.get('/health-report', async (req, res) => {
    try {
        const pool = await connectToDb();

        // Summary stats
        const stats = await pool.request().query(Q.healthReportStats);

        // Health alerts (all, with animal info)
        const alerts = await pool.request().query(Q.healthReportAlerts);

        // Keeper assignments (all, with animal + staff info)
        const keepers = await pool.request().query(Q.healthReportKeepers);

        // Feeding schedules (all, with animal + staff info)
        const feedings = await pool.request().query(Q.healthReportFeedings);

        // Health metrics (all, with animal info)
        const metrics = await pool.request().query(Q.healthReportMetrics);

        // Health records (all, with animal + staff info)
        const records = await pool.request().query(Q.healthReportRecords);

        res.json({
            stats: stats.recordset[0],
            alerts: alerts.recordset,
            keepers: keepers.recordset,
            feedings: feedings.recordset,
            metrics: metrics.recordset,
            records: records.recordset,
        });
    } catch (error) {
        console.error('Error building health report:', error);
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
            .query(Q.animalBase);
        if (animalResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Animal not found.' });
        }
        const animal = animalResult.recordset[0];

        // Health records
        const healthRecords = await pool.request()
            .input('id2', sql.Int, animalId)
            .query(Q.animalHealthRecords);

        // Health metrics
        const healthMetrics = await pool.request()
            .input('id3', sql.Int, animalId)
            .query(Q.animalHealthMetrics);

        // Keeper assignments
        const keepers = await pool.request()
            .input('id4', sql.Int, animalId)
            .query(Q.animalKeepers);

        // Feeding schedules
        let feedings = [];
        try {
            const feedResult = await pool.request()
                .input('id5', sql.Int, animalId)
                .query(Q.animalFeedings);
            feedings = feedResult.recordset;
        } catch { /* table may not exist */ }

        // Health alerts
        let alerts = [];
        try {
            const alertResult = await pool.request()
                .input('id6', sql.Int, animalId)
                .query(Q.animalAlerts);
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
        const result = await pool.request().query(Q.animalsList);
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
        const result = await pool.request().query(Q.staffList);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching staff list:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── GET meal time config ─────────────────────────────────────────────
router.get('/meal-times', async (req, res) => {
    try {
        const pool = await connectToDb();
        await pool.request().query(Q.ensureMealTimeTable);
        await pool.request().query(Q.seedMealTimes);
        const result = await pool.request().query(Q.getMealTimes);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching meal times:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── PUT meal time config ─────────────────────────────────────────────
router.put('/meal-times', verifyToken, async (req, res) => {
    try {
        const meals = req.body;
        if (!Array.isArray(meals) || meals.length === 0) {
            return res.status(400).json({ error: 'meals array required' });
        }
        const pool = await connectToDb();
        for (const meal of meals) {
            if (!meal.id || !meal.time) continue;
            await pool.request()
                .input('id',        sql.NVarChar(20),  meal.id)
                .input('time',      sql.NVarChar(5),   meal.time)
                .input('updatedBy', sql.NVarChar(100), req.user?.email || 'system')
                .query(Q.updateMealTime);
        }
        const result = await pool.request().query(Q.getMealTimes);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error updating meal times:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
