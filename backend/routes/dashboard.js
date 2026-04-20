const { Router } = require('../lib/router');
const router = new Router();
const { connectToDb } = require('../services/admin');
const Q = require('../queries/dashboardQueries');

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
            healthAlertsRes, healthAlertCountRes,
        ] = await Promise.all([
            // ── Animals: total + new this month vs last month ───────────
            pool.request().query(Q.animalStats),
            // ── Open maintenance ───────────────────────────────────────
            pool.request().query(Q.openMaintenance),
            // ── Recent activity: animals ───────────────────────────────
            pool.request().query(Q.recentAnimalActivity),
            // ── Recent activity: maintenance ───────────────────────────
            pool.request().query(Q.recentMaintenanceActivity),
            // ── Individual tickets sold this month (AdultQty+ChildQty+SeniorQty) ──
            pool.request().query(Q.ticketsThisMonth),
            // ── Individual tickets sold last month ─────────────────────
            pool.request().query(Q.ticketsLastMonth),
            // ── Memberships sold this month ────────────────────────────
            pool.request().query(Q.membershipsThisMonth),
            // ── Memberships sold last month ────────────────────────────
            pool.request().query(Q.membershipsLastMonth),
            // ── Visitor attendance: current week by VisitDate ──────────
            mk().query(Q.visitorsCurrentWeek),
            // ── Visitor attendance: previous week by VisitDate ─────────
            mk().query(Q.visitorsPreviousWeek),
            // ── Unresolved health alerts ───────────────────────────────
            pool.request().query(Q.unresolvedHealthAlerts),
            // ── Unresolved health alert count ──────────────────────────
            pool.request().query(Q.unresolvedHealthAlertCount),
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
            healthAlerts:      healthAlertsRes.recordset,
            unresolvedAlertCount: Number(healthAlertCountRes.recordset[0].cnt),
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
