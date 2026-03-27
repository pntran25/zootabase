const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');

// Returns Mon of the week containing `date` as a 'YYYY-MM-DD' string
function getMondayStr(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun … 6=Sat
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}

router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();

        const today      = new Date().toISOString().split('T')[0];
        const monday     = getMondayStr(today);
        const sunday     = addDays(monday, 6);
        const prevMonday = addDays(monday, -7);
        const prevSunday = addDays(monday, -1);

        const mk = () => pool.request()
            .input('monday',     monday)
            .input('sunday',     sunday)
            .input('prevMonday', prevMonday)
            .input('prevSunday', prevSunday);

        const [
            animalRes, maintRes,
            animalActivity, maintActivity,
            ticketThisMonth, ticketLastMonth,
            memberThisMonth, memberLastMonth,
            currWeekRes, prevWeekRes,
        ] = await Promise.all([
            // ── Animals: total + new this month vs last month ───────────
            pool.request().query(`
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN MONTH(CreatedAt) = MONTH(GETUTCDATE())
                                  AND YEAR(CreatedAt) = YEAR(GETUTCDATE())
                             THEN 1 ELSE 0 END) AS thisMonth,
                    SUM(CASE WHEN MONTH(CreatedAt) = MONTH(DATEADD(MONTH,-1,GETUTCDATE()))
                                  AND YEAR(CreatedAt) = YEAR(DATEADD(MONTH,-1,GETUTCDATE()))
                             THEN 1 ELSE 0 END) AS lastMonth
                FROM Animal WHERE DeletedAt IS NULL
            `),
            // ── Open maintenance ───────────────────────────────────────
            pool.request().query(`
                SELECT COUNT(*) AS cnt FROM MaintenanceRequest
                WHERE Status NOT IN ('Resolved','Completed') AND DeletedAt IS NULL
            `),
            // ── Recent activity: animals ───────────────────────────────
            pool.request().query(`
                SELECT TOP 5
                    'animal' AS type,
                    CASE WHEN a.UpdatedBy IS NOT NULL THEN 'Animal record updated' ELSE 'New animal added' END AS action,
                    COALESCE(NULLIF(a.Name,''), a.Species, 'Unknown') + COALESCE(' — ' + e.ExhibitName, '') AS detail,
                    COALESCE(a.UpdatedAt, a.CreatedAt, CAST(a.DateArrived AS DATETIME2)) AS ts
                FROM Animal a
                LEFT JOIN Habitat h ON a.HabitatID = h.HabitatID
                LEFT JOIN Exhibit  e ON h.ExhibitID = e.ExhibitID
                WHERE a.DeletedAt IS NULL
                ORDER BY COALESCE(a.UpdatedAt, a.CreatedAt, CAST(a.DateArrived AS DATETIME2)) DESC
            `),
            // ── Recent activity: maintenance ───────────────────────────
            pool.request().query(`
                SELECT TOP 5
                    'maintenance' AS type,
                    CASE WHEN m.Status IN ('Resolved','Completed') THEN 'Maintenance resolved' ELSE 'Maintenance logged' END AS action,
                    LEFT(m.Description, 60) + COALESCE(' — ' + ex.ExhibitName, '') AS detail,
                    COALESCE(m.UpdatedAt, m.CreatedAt, CAST(m.RequestDate AS DATETIME2)) AS ts
                FROM MaintenanceRequest m
                LEFT JOIN Exhibit ex ON m.ExhibitID = ex.ExhibitID
                WHERE m.DeletedAt IS NULL
                ORDER BY COALESCE(m.UpdatedAt, m.CreatedAt, CAST(m.RequestDate AS DATETIME2)) DESC
            `),
            // ── Individual tickets sold this month (AdultQty+ChildQty+SeniorQty) ──
            pool.request().query(`
                SELECT ISNULL(SUM(AdultQty+ChildQty+SeniorQty), 0) AS cnt
                FROM TicketOrders
                WHERE MONTH(PlacedAt) = MONTH(GETUTCDATE()) AND YEAR(PlacedAt) = YEAR(GETUTCDATE())
            `),
            // ── Individual tickets sold last month ─────────────────────
            pool.request().query(`
                SELECT ISNULL(SUM(AdultQty+ChildQty+SeniorQty), 0) AS cnt
                FROM TicketOrders
                WHERE MONTH(PlacedAt) = MONTH(DATEADD(MONTH,-1,GETUTCDATE()))
                  AND YEAR(PlacedAt)  = YEAR(DATEADD(MONTH,-1,GETUTCDATE()))
            `),
            // ── Memberships sold this month ────────────────────────────
            pool.request().query(`
                SELECT COUNT(*) AS cnt
                FROM MembershipSubscriptions
                WHERE MONTH(PlacedAt) = MONTH(GETUTCDATE()) AND YEAR(PlacedAt) = YEAR(GETUTCDATE())
            `),
            // ── Memberships sold last month ────────────────────────────
            pool.request().query(`
                SELECT COUNT(*) AS cnt
                FROM MembershipSubscriptions
                WHERE MONTH(PlacedAt) = MONTH(DATEADD(MONTH,-1,GETUTCDATE()))
                  AND YEAR(PlacedAt)  = YEAR(DATEADD(MONTH,-1,GETUTCDATE()))
            `),
            // ── Visitor attendance: current week by VisitDate ──────────
            mk().query(`
                SELECT CAST(VisitDate AS DATE) AS visitDay,
                       ISNULL(SUM(AdultQty+ChildQty+SeniorQty), 0) AS cnt
                FROM TicketOrders
                WHERE CAST(VisitDate AS DATE) >= @monday AND CAST(VisitDate AS DATE) <= @sunday
                GROUP BY CAST(VisitDate AS DATE)
            `),
            // ── Visitor attendance: previous week by VisitDate ─────────
            mk().query(`
                SELECT CAST(VisitDate AS DATE) AS visitDay,
                       ISNULL(SUM(AdultQty+ChildQty+SeniorQty), 0) AS cnt
                FROM TicketOrders
                WHERE CAST(VisitDate AS DATE) >= @prevMonday AND CAST(VisitDate AS DATE) <= @prevSunday
                GROUP BY CAST(VisitDate AS DATE)
            `),
        ]);

        // ── Build weekly visitor chart (Mon–Sun) ─────────────────────
        const currMap = new Map(currWeekRes.recordset.map(r => [r.visitDay.toISOString().split('T')[0], Number(r.cnt)]));
        const prevMap = new Map(prevWeekRes.recordset.map(r => [r.visitDay.toISOString().split('T')[0], Number(r.cnt)]));
        const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyVisitors = DAY_LABELS.map((day, i) => ({
            day,
            visitors: currMap.get(addDays(monday, i)) || 0,
            prev:     prevMap.get(addDays(prevMonday, i)) || 0,
        }));

        // ── Recent activity merge + sort ─────────────────────────────
        const recentActivity = [
            ...animalActivity.recordset,
            ...maintActivity.recordset,
        ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 8);

        // ── Animal stats ─────────────────────────────────────────────
        const { total, thisMonth, lastMonth } = animalRes.recordset[0];

        res.json({
            totalAnimals:      total,
            animalsThisMonth:  thisMonth  || 0,
            animalsLastMonth:  lastMonth  || 0,
            openMaintenance:   maintRes.recordset[0].cnt,
            recentActivity,
            ticketsThisMonth:  Number(ticketThisMonth.recordset[0].cnt),
            ticketsLastMonth:  Number(ticketLastMonth.recordset[0].cnt),
            membersThisMonth:  Number(memberThisMonth.recordset[0].cnt),
            membersLastMonth:  Number(memberLastMonth.recordset[0].cnt),
            weeklyVisitors,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
