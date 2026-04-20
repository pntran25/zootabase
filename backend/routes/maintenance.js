const { Router } = require('../lib/router');
const router = new Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { optionalAuth } = require('../middleware/authMiddleware');
const Q = require('../queries/maintenanceQueries');

// Helper to resolve or create Exhibit based on name
async function getOrCreateExhibitId(request, exhibitName) {
    const exhRes = await request
        .input('exhName', sql.NVarChar, exhibitName)
        .query(Q.findExhibit);
    
    if (exhRes.recordset.length > 0) {
        return exhRes.recordset[0].ExhibitID;
    }

    const areaRes = await request.query(Q.ensureGeneralGroundsArea);
    const areaId = areaRes.recordset[0].AreaID;

    const newExhRes = await request
        .input('newExhName', sql.NVarChar, exhibitName)
        .input('areaId', sql.Int, areaId)
        .query(Q.createExhibit);
    return newExhRes.recordset[0].ExhibitID;
}

// Helper to resolve or create Staff based on name
async function getOrCreateStaffId(request, staffName) {
    const staffRes = await request
        .input('staffName', sql.NVarChar, staffName)
        .query(Q.findStaffByName);
    
    if (staffRes.recordset.length > 0) {
        return staffRes.recordset[0].StaffID;
    }

    const newStaffRes = await request
        .input('newStaffName', sql.NVarChar, staffName)
        .query(Q.createStaff);
    return newStaffRes.recordset[0].StaffID;
}


// GET all maintenance requests
router.get('/api/maintenance', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(Q.getAll);
        
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
                .query(Q.insert);

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
                .query(Q.update);

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
            .query(Q.softDelete);
            
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting maintenance req:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
