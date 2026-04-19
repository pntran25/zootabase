const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const admin = require('../services/firebaseSetup');
const Q = require('../queries/staffQueries');

// Get all active staff (Super Admin only)
router.get('/', verifyToken, requireRole(['Super Admin', 'Zoo Manager']), async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(Q.getAll);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new staff (Super Admin only)
router.post('/', verifyToken, requireRole(['Super Admin']), async (req, res) => {
    const { firstName, lastName, email, dateOfBirth, ssn: rawSsn, role, contactNumber: rawContact, salary, hireDate } = req.body;
    const contactNumber = rawContact ? Number(rawContact.replace(/\D/g, '')) || null : null;
    const ssn = rawSsn ? rawSsn.replace(/\D/g, '') : rawSsn;
    try {
        const pool = await connectToDb();

        // SSN uniqueness check
        const ssnCheck = await pool.request()
            .input('SSN', ssn)
            .query(Q.checkSsnUnique);
        if (ssnCheck.recordset.length > 0) {
            return res.status(409).json({ error: 'SSN is already in use by another employee — please re-enter a unique SSN.' });
        }

        const fullName = `${firstName || ''} ${lastName || ''}`.trim();

        // Create Firebase user
        let firebaseUid = null;
        try {
            const firebaseUser = await admin.auth().createUser({
                email,
                password: 'ZooStaff2026!',
                displayName: fullName
            });
            firebaseUid = firebaseUser.uid;
        } catch (fbError) {
            if (fbError.code === 'auth/email-already-exists') {
                const existingUser = await admin.auth().getUserByEmail(email);
                firebaseUid = existingUser.uid;
                // Keep existing password, only sync display name
                await admin.auth().updateUser(firebaseUid, { displayName: fullName });
            } else {
                throw fbError;
            }
        }

        const result = await pool.request()
            .input('FirstName', firstName)
            .input('LastName', lastName)
            .input('Email', email)
            .input('DateOfBirth', dateOfBirth)
            .input('SSN', ssn)
            .input('Role', role)
            .input('ContactNumber', sql.BigInt, contactNumber)
            .input('Salary', sql.Decimal(10, 2), salary || 0)
            .input('HireDate', hireDate || new Date().toISOString().split('T')[0])
            .input('FullName', fullName)
            .input('FirebaseUid', firebaseUid)
            .query(Q.insertStaff);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        // Rollback Firebase user if DB insert fails
        res.status(500).json({ error: err.message });
    }
});

// Update existing staff
router.put('/:id', verifyToken, requireRole(['Super Admin']), async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, dateOfBirth, ssn: rawSsn, role, contactNumber: rawContact, salary } = req.body;
    const contactNumber = rawContact ? Number(rawContact.replace(/\D/g, '')) || null : null;
    const ssn = rawSsn ? rawSsn.replace(/\D/g, '') : rawSsn;
    try {
        const pool = await connectToDb();

        // SSN uniqueness check (exclude this staff member)
        const ssnCheck = await pool.request()
            .input('SSN', ssn)
            .input('StaffID', id)
            .query(Q.checkSsnUniqueExclude);
        if (ssnCheck.recordset.length > 0) {
            return res.status(409).json({ error: 'SSN is already in use by another employee — please re-enter a unique SSN.' });
        }

        const fullName = `${firstName || ''} ${lastName || ''}`.trim();

        await pool.request()
            .input('StaffID', id)
            .input('FirstName', firstName)
            .input('LastName', lastName)
            .input('Email', email)
            .input('DateOfBirth', dateOfBirth)
            .input('SSN', ssn)
            .input('Role', role)
            .input('FullName', fullName)
            .input('ContactNumber', sql.BigInt, contactNumber)
            .input('Salary', sql.Decimal(10, 2), salary || 0)
            .query(Q.updateStaff);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Soft-Delete staff
router.delete('/:id', verifyToken, requireRole(['Super Admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectToDb();

        // Fetch the user's FirebaseUid before deleting
        const userResult = await pool.request()
            .input('StaffID', id)
            .query(Q.getFirebaseUid);

        await pool.request()
            .input('StaffID', id)
            .query(Q.softDelete);

        if (userResult.recordset.length > 0 && userResult.recordset[0].FirebaseUid) {
            try {
                await admin.auth().deleteUser(userResult.recordset[0].FirebaseUid);
            } catch (authErr) {
                console.warn('Failed to delete Firebase user:', authErr.message);
            }
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
