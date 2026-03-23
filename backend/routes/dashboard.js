const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');

router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();

        // Animal stats: total, added this month, added last month
        const animalRes = await pool.request().query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN MONTH(DateArrived) = MONTH(GETUTCDATE())
                         AND YEAR(DateArrived)  = YEAR(GETUTCDATE())  THEN 1 ELSE 0 END) AS thisMonth,
                SUM(CASE WHEN MONTH(DateArrived) = MONTH(DATEADD(MONTH,-1,GETUTCDATE()))
                         AND YEAR(DateArrived)  = YEAR(DATEADD(MONTH,-1,GETUTCDATE())) THEN 1 ELSE 0 END) AS lastMonth
            FROM Animal WHERE DeletedAt IS NULL
        `);
        const { total, thisMonth, lastMonth } = animalRes.recordset[0];

        // Open maintenance requests
        const maintRes = await pool.request().query(`
            SELECT COUNT(*) AS cnt FROM MaintenanceRequest
            WHERE Status NOT IN ('Resolved','Completed') AND DeletedAt IS NULL
        `);
        const openMaintenance = maintRes.recordset[0].cnt;

        // Recent activity — last 5 animal changes
        const animalActivity = await pool.request().query(`
            SELECT TOP 5
                'animal' AS type,
                CASE WHEN a.UpdatedBy IS NOT NULL THEN 'Animal record updated'
                     ELSE 'New animal added' END AS action,
                COALESCE(NULLIF(a.Name,''), a.Species, 'Unknown')
                    + COALESCE(' — ' + e.ExhibitName, '') AS detail,
                COALESCE(a.UpdatedAt, CAST(a.DateArrived AS DATETIME2)) AS ts
            FROM Animal a
            LEFT JOIN Habitat  h ON a.HabitatID   = h.HabitatID
            LEFT JOIN Exhibit   e ON h.ExhibitID   = e.ExhibitID
            WHERE a.DeletedAt IS NULL
            ORDER BY COALESCE(a.UpdatedAt, CAST(a.DateArrived AS DATETIME2)) DESC
        `);

        // Recent activity — last 5 maintenance changes
        const maintActivity = await pool.request().query(`
            SELECT TOP 5
                'maintenance' AS type,
                CASE WHEN m.Status IN ('Resolved','Completed')
                     THEN 'Maintenance resolved' ELSE 'Maintenance logged' END AS action,
                LEFT(m.Description, 60) + COALESCE(' — ' + ex.ExhibitName, '') AS detail,
                CAST(m.RequestDate AS DATETIME2) AS ts
            FROM MaintenanceRequest m
            LEFT JOIN Exhibit ex ON m.ExhibitID = ex.ExhibitID
            WHERE m.DeletedAt IS NULL
            ORDER BY m.RequestDate DESC
        `);

        const recentActivity = [
            ...animalActivity.recordset,
            ...maintActivity.recordset,
        ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 8);

        res.json({
            totalAnimals: total,
            animalsThisMonth: thisMonth || 0,
            animalsLastMonth: lastMonth || 0,
            openMaintenance,
            recentActivity,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
