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

module.exports = router;
