const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');
const { verifyToken } = require('../middleware/authMiddleware');

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
        const staffResult = await pool.request()
            .input('Email', firebaseUser.email)
            .query(`SELECT StaffID, FirebaseUid FROM Staff WHERE Email = @Email`);

        if (staffResult.recordset.length > 0) {
            isStaff = true;
            userId = staffResult.recordset[0].StaffID;

            // Link FirebaseUid if not already linked
            if (!staffResult.recordset[0].FirebaseUid) {
                await pool.request()
                    .input('FirebaseUid', firebaseUser.uid)
                    .input('StaffID', userId)
                    .query(`UPDATE Staff SET FirebaseUid = @FirebaseUid WHERE StaffID = @StaffID`);
            }

            // Log Staff Traffic
            await pool.request()
                .input('StaffID', userId)
                .query(`INSERT INTO StaffLoginAudit (StaffID) VALUES (@StaffID)`);
        } else {
            // 2. Check if user exists in Customer table by FirebaseUid or Email
            const custResult = await pool.request()
                .input('FirebaseUid', firebaseUser.uid)
                .input('Email', firebaseUser.email)
                .query(`SELECT CustomerID FROM Customer WHERE FirebaseUid = @FirebaseUid OR Email = @Email`);

            if (custResult.recordset.length > 0) {
                userId = custResult.recordset[0].CustomerID;

                // Ensure FirebaseUid is linked
                await pool.request()
                    .input('FirebaseUid', firebaseUser.uid)
                    .input('CustomerID', userId)
                    .query(`UPDATE Customer SET FirebaseUid = @FirebaseUid WHERE CustomerID = @CustomerID`);
            } else {
                // Completely new Customer
                const newName = fullName || firebaseUser.name || firebaseUser.email.split('@')[0];
                const insertResult = await pool.request()
                    .input('FullName', newName)
                    .input('Email', firebaseUser.email)
                    .input('FirebaseUid', firebaseUser.uid)
                    .query(`INSERT INTO Customer (FullName, Email, FirebaseUid) VALUES (@FullName, @Email, @FirebaseUid); SELECT SCOPE_IDENTITY() AS CustomerID;`);
                
                userId = insertResult.recordset[0].CustomerID;
            }

            // Update LastLoginAt for Customer
            await pool.request()
                .input('CustomerID', userId)
                .query(`UPDATE Customer SET LastLoginAt = SYSUTCDATETIME() WHERE CustomerID = @CustomerID`);

            // Log Customer Traffic
            await pool.request()
                .input('CustomerID', userId)
                .query(`INSERT INTO CustomerLoginAudit (CustomerID) VALUES (@CustomerID)`);
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
