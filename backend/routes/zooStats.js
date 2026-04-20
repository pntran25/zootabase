const { Router } = require('../lib/router');
const router = new Router();
const { connectToDb } = require('../services/admin');
const Q = require('../queries/zooStatsQueries');

// Public endpoint – returns aggregate stats for the homepage
router.get('/', async (req, res) => {
    try {
        const pool = await connectToDb();

        const [animalRes, ticketPriceRes, exhibitRes, endangeredRes] = await Promise.all([
            pool.request().query(Q.totalAnimals),
            pool.request().query(Q.minTicketPrice),
            pool.request().query(Q.totalExhibits),
            pool.request().query(Q.endangeredCount),
        ]);

        res.json({
            totalAnimals:    animalRes.recordset[0].totalAnimals,
            startingPrice:   Number(ticketPriceRes.recordset[0].minPrice) || 0,
            totalExhibits:   exhibitRes.recordset[0].totalExhibits,
            endangeredCount: endangeredRes.recordset[0].endangeredCount,
        });
    } catch (error) {
        console.error('Zoo stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
