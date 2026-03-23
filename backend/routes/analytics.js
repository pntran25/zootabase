const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Get segregated login analytics
router.get('/logins', verifyToken, requireRole(['Super Admin']), async (req, res) => {
    try {
        const pool = await connectToDb();

        const staffLogins = await pool.request().query(`
            SELECT TOP 100 s.LogID, s.LoginTime, st.FirstName, st.LastName, st.Role, st.Email, st.StaffID
            FROM StaffLoginAudit s
            JOIN Staff st ON s.StaffID = st.StaffID
            ORDER BY s.LoginTime DESC
        `);

        const customerLogins = await pool.request().query(`
            SELECT TOP 100 c.LogID, c.LoginTime, cu.FullName, cu.Email, cu.CustomerID
            FROM CustomerLoginAudit c
            JOIN Customer cu ON c.CustomerID = cu.CustomerID
            ORDER BY c.LoginTime DESC
        `);

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
        const today = new Date().toISOString().split('T')[0];
        const end   = req.query.endDate   || today;
        const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
        const start = req.query.startDate || thirtyAgo.toISOString().split('T')[0];

        const mkReq = () => pool.request()
            .input('start', start)
            .input('end',   end);

        // ── KPIs ────────────────────────────────────────────────────
        const [shopKpi, ticketKpi, memberKpi] = await Promise.all([
            mkReq().query(`
                SELECT ISNULL(SUM(Total),0) AS revenue, COUNT(*) AS cnt
                FROM Orders
                WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
            `),
            mkReq().query(`
                SELECT ISNULL(SUM(Total),0) AS revenue,
                       ISNULL(SUM(AdultQty+ChildQty+SeniorQty),0) AS ticketCount,
                       COUNT(*) AS orderCount
                FROM TicketOrders
                WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
            `),
            mkReq().query(`
                SELECT ISNULL(SUM(Total),0) AS revenue, COUNT(*) AS cnt
                FROM MembershipSubscriptions
                WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
            `),
        ]);

        // ── Monthly trend ────────────────────────────────────────────
        const trendSql = (table) => `
            SELECT FORMAT(PlacedAt,'MMM') AS month,
                   YEAR(PlacedAt) AS yr,
                   MONTH(PlacedAt) AS mo,
                   ISNULL(SUM(Total),0) AS rev
            FROM ${table}
            WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
            GROUP BY FORMAT(PlacedAt,'MMM'), YEAR(PlacedAt), MONTH(PlacedAt)
            ORDER BY yr, mo
        `;
        const [orderTrend, ticketTrend, memberTrend] = await Promise.all([
            mkReq().query(trendSql('Orders')),
            mkReq().query(trendSql('TicketOrders')),
            mkReq().query(trendSql('MembershipSubscriptions')),
        ]);

        // Merge into unified month map
        const monthMap = new Map();
        const addTrend = (rows, key) => rows.forEach(r => {
            const k = `${r.yr}-${String(r.mo).padStart(2,'0')}`;
            if (!monthMap.has(k)) monthMap.set(k, { month: r.month, yr: r.yr, mo: r.mo, tickets: 0, memberships: 0, giftShop: 0 });
            monthMap.get(k)[key] = Number(r.rev);
        });
        addTrend(ticketTrend.recordset,  'tickets');
        addTrend(memberTrend.recordset,  'memberships');
        addTrend(orderTrend.recordset,   'giftShop');
        const monthlyTrend = Array.from(monthMap.values())
            .sort((a, b) => a.yr - b.yr || a.mo - b.mo)
            .map(({ month, tickets, memberships, giftShop }) => ({ month, tickets, memberships, giftShop }));

        // ── Tier breakdowns ──────────────────────────────────────────
        const [ticketTiers, memberTiers] = await Promise.all([
            mkReq().query(`
                SELECT TicketType AS tier, COUNT(*) AS count
                FROM TicketOrders
                WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
                GROUP BY TicketType ORDER BY count DESC
            `),
            mkReq().query(`
                SELECT PlanName AS tier, COUNT(*) AS count
                FROM MembershipSubscriptions
                WHERE CAST(PlacedAt AS DATE) >= @start AND CAST(PlacedAt AS DATE) <= @end
                GROUP BY PlanName ORDER BY count DESC
            `),
        ]);

        // ── Gift shop categories (OPENJSON on OrderItems) ────────────
        let giftCats = [];
        try {
            const catRes = await mkReq().query(`
                SELECT JSON_VALUE(item.value, '$.category') AS category, COUNT(*) AS count
                FROM Orders o
                CROSS APPLY OPENJSON(o.OrderItems) AS item
                WHERE CAST(o.PlacedAt AS DATE) >= @start AND CAST(o.PlacedAt AS DATE) <= @end
                  AND JSON_VALUE(item.value, '$.category') IS NOT NULL
                GROUP BY JSON_VALUE(item.value, '$.category')
                ORDER BY count DESC
            `);
            giftCats = catRes.recordset;
            // Fallback: group by product name if no category field in JSON
            if (giftCats.length === 0) {
                const nameRes = await mkReq().query(`
                    SELECT JSON_VALUE(item.value, '$.name') AS category, COUNT(*) AS count
                    FROM Orders o
                    CROSS APPLY OPENJSON(o.OrderItems) AS item
                    WHERE CAST(o.PlacedAt AS DATE) >= @start AND CAST(o.PlacedAt AS DATE) <= @end
                      AND JSON_VALUE(item.value, '$.name') IS NOT NULL
                    GROUP BY JSON_VALUE(item.value, '$.name')
                    ORDER BY count DESC
                `);
                giftCats = nameRes.recordset;
            }
        } catch (_) { /* OPENJSON not supported or OrderItems null */ }

        // ── Compose response ─────────────────────────────────────────
        const shopR   = shopKpi.recordset[0];
        const ticketR = ticketKpi.recordset[0];
        const memberR = memberKpi.recordset[0];

        const ticketRevenue     = Number(ticketR.revenue);
        const membershipRevenue = Number(memberR.revenue);
        const giftShopRevenue   = Number(shopR.revenue);
        const ticketCount       = Number(ticketR.ticketCount);
        const memberCount       = Number(memberR.cnt);
        const orderCount        = Number(shopR.cnt);

        res.json({
            kpis: {
                totalRevenue: ticketRevenue + membershipRevenue + giftShopRevenue,
                ticketRevenue,
                ticketCount,
                membershipRevenue,
                memberCount,
                giftShopRevenue,
                orderCount,
                totalTransactions: ticketCount + memberCount + orderCount,
            },
            monthlyTrend,
            ticketTiers:       ticketTiers.recordset.map(r => ({ tier: r.tier, count: Number(r.count) })),
            membershipTiers:   memberTiers.recordset.map(r => ({ tier: r.tier, count: Number(r.count) })),
            giftShopCategories: giftCats.map(r => ({ category: r.category, count: Number(r.count) })),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
