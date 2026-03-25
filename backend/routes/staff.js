const express = require('express');
const router = express.Router();
const { connectToDb } = require('../services/admin');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const admin = require('../services/firebaseSetup');

// Get all active staff (Super Admin only)
router.get('/', verifyToken, requireRole(['Super Admin']), async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query('SELECT StaffID, FirstName, LastName, FullName, Email, DateOfBirth, SSN, Role, ContactNumber, Salary, HireDate FROM Staff WHERE DeletedAt IS NULL ORDER BY StaffID DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new staff (Super Admin only)
// Note: StaffID is auto-generated
router.post('/', verifyToken, requireRole(['Super Admin']), async (req, res) => {
    const { firstName, lastName, email, dateOfBirth, ssn, role, contactNumber, salary, hireDate } = req.body;
    try {
        const pool = await connectToDb();

        // SSN uniqueness check
        const ssnCheck = await pool.request()
            .input('SSN', ssn)
            .query(`SELECT StaffID FROM Staff WHERE SSN = @SSN AND DeletedAt IS NULL`);
        if (ssnCheck.recordset.length > 0) {
            return res.status(409).json({ error: 'SSN is already used by another employee.' });
        }

        const fullName = `${firstName || ''} ${lastName || ''}`.trim();

        // Create Firebase auth user first
        let firebaseUserRecord;
        try {
            firebaseUserRecord = await admin.auth().createUser({
                email: email,
                password: 'ZooStaff2026!', // Default password for new staff
                displayName: fullName
            });
        } catch (authErr) {
            return res.status(400).json({ error: 'Failed to create Firebase user: ' + authErr.message });
        }

        try {
            const result = await pool.request()
                .input('FirstName', firstName)
                .input('LastName', lastName)
                .input('Email', email)
                .input('DateOfBirth', dateOfBirth)
                .input('SSN', ssn)
                .input('Role', role)
                .input('ContactNumber', contactNumber)
                .input('Salary', salary || 0)
                .input('HireDate', hireDate || new Date().toISOString().split('T')[0])
                .input('FullName', fullName)
                .input('FirebaseUid', firebaseUserRecord.uid)
                .query(`INSERT INTO Staff (FirstName, LastName, Email, DateOfBirth, SSN, Role, ContactNumber, Salary, HireDate, FullName, FirebaseUid)
                        OUTPUT INSERTED.*
                        VALUES (@FirstName, @LastName, @Email, @DateOfBirth, @SSN, @Role, @ContactNumber, @Salary, @HireDate, @FullName, @FirebaseUid)`);

            res.status(201).json(result.recordset[0]);
        } catch (dbErr) {
            // Rollback Firebase user creation if DB insert fails
            if (firebaseUserRecord) {
                await admin.auth().deleteUser(firebaseUserRecord.uid).catch(() => {});
            }
            throw dbErr;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update existing staff
router.put('/:id', verifyToken, requireRole(['Super Admin']), async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, dateOfBirth, ssn, role, contactNumber, salary } = req.body;
    try {
        const pool = await connectToDb();

        // SSN uniqueness check (exclude this staff member)
        const ssnCheck = await pool.request()
            .input('SSN', ssn)
            .input('StaffID', id)
            .query(`SELECT StaffID FROM Staff WHERE SSN = @SSN AND DeletedAt IS NULL AND StaffID != @StaffID`);
        if (ssnCheck.recordset.length > 0) {
            return res.status(409).json({ error: 'SSN is already used by another employee.' });
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
            .input('ContactNumber', contactNumber)
            .input('Salary', salary)
            .query(`UPDATE Staff 
                    SET FirstName = @FirstName, LastName = @LastName, Email = @Email, 
                        DateOfBirth = @DateOfBirth, SSN = @SSN, Role = @Role, FullName = @FullName, 
                        ContactNumber = @ContactNumber, Salary = @Salary 
                    WHERE StaffID = @StaffID`);
        
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
            .query(`SELECT FirebaseUid FROM Staff WHERE StaffID = @StaffID`);
            
        await pool.request()
            .input('StaffID', id)
            .query(`UPDATE Staff SET DeletedAt = SYSUTCDATETIME() WHERE StaffID = @StaffID`);
            
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
