const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { optionalAuth } = require('../middleware/authMiddleware');

// Helper to resolve or create Exhibit based on name
async function getOrCreateExhibitId(request, exhibitName) {
    const exhRes = await request
        .input('exhName', sql.NVarChar, exhibitName)
        .query('SELECT ExhibitID FROM Exhibit WHERE ExhibitName = @exhName');
    
    if (exhRes.recordset.length > 0) {
        return exhRes.recordset[0].ExhibitID;
    }

    const areaRes = await request.query(`
        IF NOT EXISTS (SELECT 1 FROM Area WHERE AreaName = 'General Grounds')
        BEGIN
            DECLARE @AreaOut TABLE (AreaID INT);
            INSERT INTO Area (AreaName) OUTPUT INSERTED.AreaID INTO @AreaOut VALUES ('General Grounds');
            SELECT AreaID FROM @AreaOut;
        END
        ELSE
        BEGIN
            SELECT AreaID FROM Area WHERE AreaName = 'General Grounds';
        END
    `);
    const areaId = areaRes.recordset[0].AreaID;

    const newExhRes = await request
        .input('newExhName', sql.NVarChar, exhibitName)
        .input('areaId', sql.Int, areaId)
        .query(`
            DECLARE @ExhOut TABLE (ExhibitID INT);
            INSERT INTO Exhibit (ExhibitName, AreaID, Capacity, OpeningHours)
            OUTPUT INSERTED.ExhibitID INTO @ExhOut
            VALUES (@newExhName, @areaId, 100, '09:00-17:00');
            SELECT ExhibitID FROM @ExhOut;
        `);
    return newExhRes.recordset[0].ExhibitID;
}

// Helper to resolve or create Staff based on name
async function getOrCreateStaffId(request, staffName) {
    const staffRes = await request
        .input('staffName', sql.NVarChar, staffName)
        .query('SELECT StaffID FROM Staff WHERE FullName = @staffName');
    
    if (staffRes.recordset.length > 0) {
        return staffRes.recordset[0].StaffID;
    }

    const newStaffRes = await request
        .input('newStaffName', sql.NVarChar, staffName)
        .query(`
            DECLARE @StaffOut TABLE (StaffID INT);
            INSERT INTO Staff (FullName, Role, Salary, HireDate)
            OUTPUT INSERTED.StaffID INTO @StaffOut
            VALUES (@newStaffName, 'Manager', 60000.00, SYSUTCDATETIME());
            SELECT StaffID FROM @StaffOut;
        `);
    return newStaffRes.recordset[0].StaffID;
}


// GET all maintenance requests
router.get('/api/maintenance', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(`
            SELECT m.*, ex.ExhibitName, s.FullName as StaffName
            FROM MaintenanceRequest m
            LEFT JOIN Exhibit ex ON m.ExhibitID = ex.ExhibitID
            LEFT JOIN Staff s ON m.StaffID = s.StaffID
            WHERE m.DeletedAt IS NULL
        `);
        
        const mappedResult = result.recordset.map(row => ({
            id: row.RequestID.toString(),
            exhibit: row.ExhibitName || 'Unknown Location',
            description: row.Description,
            dateSubmitted: row.RequestDate ? row.RequestDate.toISOString().split('T')[0] : '',
            status: row.Status,
            reportedBy: row.StaffName || 'Unknown Staff',
            createdBy: row.CreatedBy || null,
            updatedBy: row.UpdatedBy || null,
        }));
        
        res.json(mappedResult);
    } catch (error) {
        console.error('Error fetching maintenance:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST new maintenance request
router.post('/api/maintenance', optionalAuth, async (req, res) => {
    try {
        const { exhibit, description, dateSubmitted, status, reportedBy } = req.body;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        
        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            const exhibitId = await getOrCreateExhibitId(request, exhibit);
            const staffId = await getOrCreateStaffId(request, reportedBy || 'Admin User');

            const result = await request
                .input('exhId', sql.Int, exhibitId)
                .input('desc', sql.NVarChar, description)
                .input('reqDate', sql.Date, dateSubmitted)
                .input('status', sql.NVarChar, status)
                .input('staffId', sql.Int, staffId)
                .input('createdBy', sql.NVarChar, adminName)
                .query(`
                    DECLARE @Out TABLE (RequestID INT);
                    INSERT INTO MaintenanceRequest (ExhibitID, Description, RequestDate, Status, StaffID, CreatedBy, CreatedAt)
                    OUTPUT INSERTED.RequestID INTO @Out
                    VALUES (@exhId, @desc, @reqDate, @status, @staffId, @createdBy, SYSUTCDATETIME());
                    SELECT RequestID FROM @Out;
                `);

            await transaction.commit();
            res.status(201).json({ id: result.recordset[0].RequestID.toString(), ...req.body });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error creating maintenance req:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update maintenance request
router.put('/api/maintenance/:id', optionalAuth, async (req, res) => {
    try {
        const { exhibit, description, dateSubmitted, status, reportedBy } = req.body;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        
        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            const exhibitId = await getOrCreateExhibitId(request, exhibit);
            const staffId = await getOrCreateStaffId(request, reportedBy || 'Admin User');

            await request
                .input('id', sql.Int, parseInt(req.params.id, 10))
                .input('exhId', sql.Int, exhibitId)
                .input('desc', sql.NVarChar, description)
                .input('reqDate', sql.Date, dateSubmitted)
                .input('status', sql.NVarChar, status)
                .input('staffId', sql.Int, staffId)
                .input('updatedBy', sql.NVarChar, adminName)
                .query(`
                    UPDATE MaintenanceRequest
                    SET ExhibitID = @exhId, Description = @desc, RequestDate = @reqDate,
                        Status = @status, StaffID = @staffId, UpdatedAt = SYSUTCDATETIME(),
                        UpdatedBy = @updatedBy
                    WHERE RequestID = @id
                `);

            await transaction.commit();
            res.json({ success: true });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error updating maintenance req:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE maintenance request (soft delete)
router.delete('/api/maintenance/:id', optionalAuth, async (req, res) => {
    try {
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('deletedBy', sql.NVarChar, adminName)
            .query('UPDATE MaintenanceRequest SET DeletedAt = SYSUTCDATETIME(), DeletedBy = @deletedBy WHERE RequestID = @id');
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting maintenance req:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
