const { Router } = require('../lib/router');
const router = new Router();
const { connectToDb } = require('../services/admin');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const Q = require('../queries/analyticsQueries');

// Get segregated login analytics
router.get('/logins', verifyToken, requireRole(['Super Admin', 'Zoo Manager']), async (req, res) => {
    try {
        const pool = await connectToDb();

        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const start = req.query.startDate || today;
        const rawEnd = req.query.endDate  || today;
        const end    = rawEnd > today ? today : rawEnd;

        const mkReq = () => pool.request()
            .input('start', start)
            .input('end',   end);

        const staffLogins = await mkReq().query(Q.staffLogins);

        const customerLogins = await mkReq().query(Q.customerLogins);

        res.json({
            staffLogins: staffLogins.recordset,
            customerLogins: customerLogins.recordset
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get revenue & transaction overview for a date range
router.get('/overview', async (req, res) => {
    try {
        const pool = await connectToDb();

        // Parse date range — default to last 30 days
        const now2 = new Date();
        const today = `${now2.getFullYear()}-${String(now2.getMonth()+1).padStart(2,'0')}-${String(now2.getDate()).padStart(2,'0')}`;
        const rawEnd = req.query.endDate || today;
        const end    = rawEnd > today ? today : rawEnd;
        const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
        const start = req.query.startDate || `${thirtyAgo.getFullYear()}-${String(thirtyAgo.getMonth()+1).padStart(2,'0')}-${String(thirtyAgo.getDate()).padStart(2,'0')}`;

        const mkReq = () => pool.request()
            .input('start', start)
            .input('end',   end);

        // ── KPIs ────────────────────────────────────────────────────
        const [shopKpi, ticketKpi, memberKpi, eventKpi] = await Promise.all([
            mkReq().query(Q.shopKpi),
            mkReq().query(Q.ticketKpi),
            mkReq().query(Q.memberKpi),
            mkReq().query(Q.eventKpi),
        ]);

        // ── Choose granularity based on range width ──────────────────
        const daysDiff = Math.round((new Date(end) - new Date(start)) / 86400000);
        const granularity = daysDiff <= 60 ? 'daily' : 'monthly';

        const trendSql = (table) => granularity === 'daily' ? Q.trendDaily(table) : Q.trendMonthly(table);
        const [orderTrend, ticketTrend, memberTrend, eventTrend] = await Promise.all([
            mkReq().query(trendSql('Orders')),
            mkReq().query(trendSql('TicketOrders')),
            mkReq().query(trendSql('MembershipSubscriptions')),
            mkReq().query(trendSql('EventBookings')),
        ]);

        // Merge into unified map keyed by day or month
        const monthMap = new Map();
        const addTrend = (rows, key) => rows.forEach(r => {
            const k = granularity === 'daily'
                ? `${r.yr}-${String(r.mo).padStart(2,'0')}-${String(r.dy).padStart(2,'0')}`
                : `${r.yr}-${String(r.mo).padStart(2,'0')}`;
            if (!monthMap.has(k)) monthMap.set(k, { month: r.month, yr: r.yr, mo: r.mo, dy: r.dy || 0, tickets: 0, memberships: 0, giftShop: 0, events: 0 });
            monthMap.get(k)[key] = Number(r.rev);
        });
        addTrend(ticketTrend.recordset,  'tickets');
        addTrend(memberTrend.recordset,  'memberships');
        addTrend(orderTrend.recordset,   'giftShop');
        addTrend(eventTrend.recordset,   'events');
        const monthlyTrend = Array.from(monthMap.values())
            .sort((a, b) => a.yr - b.yr || a.mo - b.mo || a.dy - b.dy)
            .map(({ month, tickets, memberships, giftShop, events }) => ({ month, tickets, memberships, giftShop, events }));

        // ── Tier breakdowns ──────────────────────────────────────────
        const [ticketTiers, memberTiers, eventTiers] = await Promise.all([
            mkReq().query(Q.ticketTiers),
            mkReq().query(Q.memberTiers),
            mkReq().query(Q.eventTiers),
        ]);

        // ── Gift shop categories (OPENJSON on OrderItems) ────────────
        let giftCats = [];
        try {
            const catRes = await mkReq().query(Q.shopCategoryBreakdown);
            giftCats = catRes.recordset;
            // Fallback: group by product name if no category field in JSON
            if (giftCats.length === 0) {
                const nameRes = await mkReq().query(Q.shopNameFallback);
                giftCats = nameRes.recordset;
            }
        } catch (_) { /* OPENJSON not supported or OrderItems null */ }

        // ── Compose response ─────────────────────────────────────────
        const shopR   = shopKpi.recordset[0];
        const ticketR = ticketKpi.recordset[0];
        const memberR = memberKpi.recordset[0];
        const eventR  = eventKpi.recordset[0];

        const ticketRevenue     = Number(ticketR.revenue);
        const membershipRevenue = Number(memberR.revenue);
        const giftShopRevenue   = Number(shopR.revenue);
        const eventRevenue      = Number(eventR.revenue);
        const ticketCount       = Number(ticketR.ticketCount);
        const memberCount       = Number(memberR.cnt);
        const orderCount        = Number(shopR.cnt);
        const eventCount        = Number(eventR.cnt);
        const eventAttendees    = Number(eventR.attendees);

        res.json({
            granularity,
            kpis: {
                totalRevenue: ticketRevenue + membershipRevenue + giftShopRevenue + eventRevenue,
                ticketRevenue,
                ticketCount,
                membershipRevenue,
                memberCount,
                giftShopRevenue,
                orderCount,
                eventRevenue,
                eventCount,
                eventAttendees,
                totalTransactions: ticketCount + memberCount + orderCount + eventCount,
            },
            monthlyTrend,
            ticketTiers:        ticketTiers.recordset.map(r => ({ tier: r.tier, count: Number(r.count) })),
            membershipTiers:    memberTiers.recordset.map(r => ({ tier: r.tier, count: Number(r.count) })),
            giftShopCategories: giftCats.map(r => ({ category: r.category, count: Number(r.count) })),
            eventTiers:         eventTiers.recordset.map(r => ({ tier: r.tier || 'Uncategorized', count: Number(r.count) })),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
