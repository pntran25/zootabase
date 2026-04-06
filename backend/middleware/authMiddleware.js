const admin = require('../services/firebaseSetup');
const { connectToDb } = require('../services/admin');

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken; // contains uid, email, etc.

        // Also fetch user role from SQL database to attach to req.userProfile
        const pool = await connectToDb();
        
        // Check if user is Staff — first by FirebaseUid, then fallback to email
        let staffResult = await pool.request()
            .input('FirebaseUid', decodedToken.uid)
            .query(`SELECT StaffID, FirstName, LastName, Email, Role FROM Staff WHERE FirebaseUid = @FirebaseUid AND DeletedAt IS NULL`);

        // Fallback: if UID not found, try matching by email (handles UID changes)
        if (staffResult.recordset.length === 0 && decodedToken.email) {
            staffResult = await pool.request()
                .input('Email', decodedToken.email)
                .query(`SELECT StaffID, FirstName, LastName, Email, Role FROM Staff WHERE Email = @Email AND DeletedAt IS NULL`);

            // Auto-link the current FirebaseUid so future lookups work by UID
            if (staffResult.recordset.length > 0) {
                await pool.request()
                    .input('FirebaseUid', decodedToken.uid)
                    .input('StaffID', staffResult.recordset[0].StaffID)
                    .query(`UPDATE Staff SET FirebaseUid = @FirebaseUid WHERE StaffID = @StaffID`);
            }
        }

        if (staffResult.recordset.length > 0) {
            req.userProfile = staffResult.recordset[0];
            req.userProfile.isStaff = true;
        } else {
            // Check if user is Customer
            const custResult = await pool.request()
                .input('FirebaseUid', decodedToken.uid)
                .query(`SELECT CustomerID, FullName, Email FROM Customer WHERE FirebaseUid = @FirebaseUid`);
            
            if (custResult.recordset.length > 0) {
                req.userProfile = custResult.recordset[0];
                req.userProfile.Role = 'Viewer'; // Default role for standard users
                req.userProfile.isStaff = false;
            } else {
                // Not found in DB yet (new signup)
                req.userProfile = { Role: 'Viewer', isStaff: false, isNew: true };
            }
        }
        
        next();
    } catch (error) {
        console.error('Error verifying auth token', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

// Middleware for Role-Based Access Control
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.userProfile || !req.userProfile.Role) {
            return res.status(403).json({ error: 'Forbidden: No role assigned' });
        }
        
        if (allowedRoles.includes('Super Admin')) {
            if (req.userProfile.Role === 'Super Admin') return next();
        }
        
        if (allowedRoles.includes(req.userProfile.Role)) {
            return next();
        }

        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    };
};

// Middleware that tries to identify the caller but never blocks the request
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.userProfile = null;
        return next();
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        const pool = await connectToDb();
        const staffResult = await pool.request()
            .input('FirebaseUid', decodedToken.uid)
            .query(`SELECT StaffID, FirstName, LastName, Email, Role FROM Staff WHERE FirebaseUid = @FirebaseUid`);
        if (staffResult.recordset.length > 0) {
            req.userProfile = staffResult.recordset[0];
            req.userProfile.isStaff = true;
        } else {
            req.userProfile = { FirstName: decodedToken.name || decodedToken.email, LastName: '', isStaff: false };
        }
    } catch {
        req.userProfile = null;
    }
    next();
};

module.exports = { verifyToken, requireRole, optionalAuth };
