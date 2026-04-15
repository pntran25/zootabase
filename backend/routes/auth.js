const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');
const Q = require('../queries/authQueries');

// Sync Firebase Auth with SQL Database and Log Traffic
router.post('/sync', verifyToken, async (req, res) => {
    require('fs').appendFileSync('sync-hit.log', `[${new Date().toISOString()}] /sync hit for ${req.user.email}\n`);
    try {
        const pool = await connectToDb();
        const firebaseUser = req.user; // from decoded token

        let isStaff = false;
        let userId = null;

        // Extract potential name/email sent from frontend during signup
        const { fullName } = req.body;

        // 1. Check if user exists in Staff table by Email
        console.log(`[AUTH SYNC] Checking Staff table for email: ${firebaseUser.email}`);
        const staffResult = await pool.request()
            .input('Email', firebaseUser.email)
            .query(Q.findStaffByEmail);

        console.log(`[AUTH SYNC] Staff query result length: ${staffResult.recordset.length}`);

        if (staffResult.recordset.length > 0) {
            isStaff = true;
            console.log(`[AUTH SYNC] User ${firebaseUser.email} IS STAFF. StaffID: ${staffResult.recordset[0].StaffID}`);
            userId = staffResult.recordset[0].StaffID;

            // Link or Update FirebaseUid if it doesn't match
            if (staffResult.recordset[0].FirebaseUid !== firebaseUser.uid) {
                await pool.request()
                    .input('FirebaseUid', firebaseUser.uid)
                    .input('StaffID', userId)
                    .query(Q.updateStaffFirebaseUid);
            }

            // Log staff login
            await pool.request()
                .input('StaffID', userId)
                .query(Q.insertStaffLoginAudit);

        } else {
            console.log(`[AUTH SYNC] User ${firebaseUser.email} IS NOT STAFF. Attempting to match Customer.`);
            // 2. Check if user exists in Customer table by FirebaseUid or Email
            const custResult = await pool.request()
                .input('FirebaseUid', firebaseUser.uid)
                .input('Email', firebaseUser.email)
                .query(Q.findCustomer);

            if (custResult.recordset.length > 0) {
                userId = custResult.recordset[0].CustomerID;

                // Ensure FirebaseUid is linked
                await pool.request()
                    .input('FirebaseUid', firebaseUser.uid)
                    .input('CustomerID', userId)
                    .query(Q.updateCustomerFirebaseUid);
            } else {
                // Completely new Customer
                const newName = fullName || firebaseUser.name || firebaseUser.email.split('@')[0];
                const insertResult = await pool.request()
                    .input('FullName', newName)
                    .input('Email', firebaseUser.email)
                    .input('FirebaseUid', firebaseUser.uid)
                    .query(Q.insertCustomer);
                
                userId = insertResult.recordset[0].CustomerID;
            }

            // Update LastLoginAt for Customer
            await pool.request()
                .input('CustomerID', userId)
                .query(Q.updateCustomerLastLogin);

            // Log customer login
            await pool.request()
                .input('CustomerID', userId)
                .query(Q.insertCustomerLoginAudit);

        }

        res.json({ success: true, isStaff, userId });
    } catch (error) {
        console.error('Auth sync error:', error);
        require('fs').writeFileSync('sync-error.log', String(error) + '\n' + String(error.stack));
        res.status(500).json({ error: 'Failed to sync authentication' });
    }
});

// Get Current User Profile
router.get('/me', verifyToken, (req, res) => {
    // req.userProfile is populated by verifyToken middleware
    res.json(req.userProfile);
});

module.exports = router;
