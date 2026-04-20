const { Router } = require('../lib/router');
const router = new Router();
const sql = require('mssql');
const { connectToDb } = require('../services/admin');
const { optionalAuth, verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Q = require('../queries/eventQueries');

const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
const imageDir = path.join(uploadsRoot, 'Event_Images');
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, imageDir),
    filename: (req, file, cb) => cb(null, 'event-' + Date.now() + path.extname(file.originalname)),
});
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
});

// Helper to resolve or create Exhibit based on name
async function resolveOrCreateExhibit(transaction, exhibitName) {
    // Try to find existing
    const exhRes = await new sql.Request(transaction)
        .input('exhName', sql.NVarChar, exhibitName)
        .query(Q.findExhibit);

    if (exhRes.recordset.length > 0) {
        return exhRes.recordset[0].ExhibitID;
    }

    // Create an Area -> Exhibit chain if missing
    const areaRes = await new sql.Request(transaction)
        .query(Q.ensureEventsArea);
    const areaId = areaRes.recordset[0].AreaID;

    const newExhRes = await new sql.Request(transaction)
        .input('newExhName', sql.NVarChar, exhibitName)
        .input('areaId', sql.Int, areaId)
        .query(Q.createExhibit);
    return newExhRes.recordset[0].ExhibitID;
}

// GET all events
router.get('/api/events', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request().query(Q.getAll);

        const mappedResult = result.recordset.map(row => {
            // Format times removing seconds (e.g. '10:30:00' -> '10:30')
            let sTime = row.StartTime ? row.StartTime.toISOString().substring(11, 16) : '';
            let eTime = row.EndTime ? row.EndTime.toISOString().substring(11, 16) : '';
            // If they are returned as strings (depends on tedious config), handle it
            if (typeof row.StartTime === 'string') sTime = row.StartTime.substring(0, 5);
            if (typeof row.EndTime === 'string') eTime = row.EndTime.substring(0, 5);

            return {
                id: row.EventID.toString(),
                name: row.EventName,
                date: row.EventDate ? row.EventDate.toISOString().split('T')[0] : '',
                endDate: row.EndDate ? row.EndDate.toISOString().split('T')[0] : '',
                imageUrl: row.ImageUrl || null,
                startTime: sTime,
                endTime: eTime,
                exhibit: row.ExhibitName || 'Unknown Location',
                capacity: row.Capacity,
                description: row.Description || '',
                category: row.Category || '',
                isFeatured: row.IsFeatured === true || row.IsFeatured === 1,
                price: row.Price || 0,
                createdBy: row.CreatedBy || null,
                updatedBy: row.UpdatedBy || null,
                spotsBooked: Number(row.SpotsBooked) || 0,
                spotsLeft: Math.max(0, (row.Capacity || 0) - (Number(row.SpotsBooked) || 0)),
            };
        });

        res.json(mappedResult);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST new event
router.post('/api/events', optionalAuth, async (req, res) => {
    try {
        let { name, date, endDate, startTime, endTime, exhibit, capacity, description, category, isFeatured, price } = req.body;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;

        // Ensure time has seconds for SQL TIME(0) format
        if (startTime.length === 5) startTime += ':00';
        if (endTime.length === 5) endTime += ':00';

        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const exhibitId = await resolveOrCreateExhibit(transaction, exhibit);

            const result = await new sql.Request(transaction)
                .input('name', sql.NVarChar, name)
                .input('date', sql.Date, date)
                .input('endDate', sql.Date, endDate || null)
                .input('startTime', sql.NVarChar, startTime)
                .input('endTime', sql.NVarChar, endTime)
                .input('exhId', sql.Int, exhibitId)
                .input('capacity', sql.Int, parseInt(capacity, 10))
                .input('description', sql.NVarChar, description || '')
                .input('category', sql.NVarChar, category || '')
                .input('isFeatured', sql.Bit, isFeatured ? 1 : 0)
                .input('price', sql.Decimal(10, 2), parseFloat(price || 0))
                .input('createdBy', sql.NVarChar, adminName)
                .query(Q.insert);

            await transaction.commit();
            res.status(201).json({ id: result.recordset[0].id.toString(), ...req.body });
        } catch (err) {
            try { await transaction.rollback(); } catch (_) { /* already aborted */ }
            throw err;
        }
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update event
router.put('/api/events/:id', optionalAuth, async (req, res) => {
    try {
        let { name, date, endDate, startTime, endTime, exhibit, capacity, description, category, isFeatured, price } = req.body;
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;

        if (startTime.length === 5) startTime += ':00';
        if (endTime.length === 5) endTime += ':00';

        const pool = await connectToDb();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const exhibitId = await resolveOrCreateExhibit(transaction, exhibit);

            await new sql.Request(transaction)
                .input('id', sql.Int, parseInt(req.params.id, 10))
                .input('name', sql.NVarChar, name)
                .input('date', sql.Date, date)
                .input('endDate', sql.Date, endDate || null)
                .input('startTime', sql.NVarChar, startTime)
                .input('endTime', sql.NVarChar, endTime)
                .input('exhId', sql.Int, exhibitId)
                .input('capacity', sql.Int, parseInt(capacity, 10))
                .input('description', sql.NVarChar, description || '')
                .input('category', sql.NVarChar, category || '')
                .input('isFeatured', sql.Bit, isFeatured ? 1 : 0)
                .input('price', sql.Decimal(10, 2), parseFloat(price || 0))
                .input('updatedBy', sql.NVarChar, adminName)
                .query(Q.update);

            await transaction.commit();
            res.json({ success: true });
        } catch (err) {
            try { await transaction.rollback(); } catch (_) { /* already aborted */ }
            throw err;
        }
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE event (soft delete)
router.delete('/api/events/:id', optionalAuth, async (req, res) => {
    try {
        const adminName = req.userProfile ? `${req.userProfile.FirstName} ${req.userProfile.LastName}`.trim() : null;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('deletedBy', sql.NVarChar, adminName)
            .query(Q.softDelete);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST upload event image
router.post('/api/events/:id/image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image file provided' });
        const imageUrl = '/images/Event_Images/' + req.file.filename;
        const pool = await connectToDb();
        await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .input('imageUrl', sql.NVarChar, imageUrl)
            .query(Q.updateImage);
        res.json({ message: 'Image uploaded successfully', imageUrl });
    } catch (error) {
        console.error('Error uploading event image:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET spots remaining for a specific date (used by checkout modal)
router.get('/api/events/:id/spots', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'date query param required.' });
        const pool = await connectToDb();
        const result = await pool.request()
            .input('evId', sql.Int, parseInt(req.params.id, 10))
            .input('bookDate', sql.Date, date)
            .query(Q.spotsForDate);
        if (!result.recordset.length) return res.status(404).json({ error: 'Event not found.' });
        const row = result.recordset[0];
        const capacity = row.Capacity || 0;
        const booked = Number(row.SpotsBooked) || 0;
        res.json({ capacity, booked, remaining: Math.max(0, capacity - booked) });
    } catch (error) {
        console.error('Error fetching event spots:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST create event booking (public checkout)
router.post('/api/event-bookings', async (req, res) => {
    try {
        const {
            eventId, bookingDate, quantity,
            firstName, lastName, email, phone,
            addressLine1, addressLine2, city, stateProvince, zipCode,
            billingSameAsContact, billingFullName,
            billingAddress1, billingAddress2, billingCity, billingState, billingZip,
            cardLastFour,
        } = req.body;

        if (!eventId || !bookingDate || !quantity || !firstName || !lastName || !email) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const pool = await connectToDb();

        // Fetch event to validate date range + get price + check capacity for this specific date
        const evRes = await pool.request()
            .input('evId', sql.Int, parseInt(eventId, 10))
            .input('bookDate', sql.Date, bookingDate)
            .query(Q.validateEvent);
        if (!evRes.recordset.length) return res.status(404).json({ error: 'Event not found.' });

        const ev = evRes.recordset[0];
        const startDate = ev.EventDate ? ev.EventDate.toISOString().split('T')[0] : null;
        const endDate = ev.EndDate ? ev.EndDate.toISOString().split('T')[0] : startDate;
        if (startDate && (bookingDate < startDate || bookingDate > endDate)) {
            return res.status(400).json({ error: 'Booking date is outside the event date range.' });
        }

        const remaining = (ev.Capacity || 0) - Number(ev.SpotsBooked);
        if (remaining <= 0) {
            return res.status(409).json({ error: `This event is sold out for ${bookingDate}. Please try a different date.` });
        }
        if (quantity > remaining) {
            return res.status(409).json({ error: `Only ${remaining} spot(s) remaining for ${bookingDate}.` });
        }

        const unitPrice = Number(ev.Price) || 0;
        const subtotal = unitPrice * quantity;
        const total = subtotal;

        const result = await pool.request()
            .input('eventId', sql.Int, parseInt(eventId, 10))
            .input('bookingDate', sql.Date, bookingDate)
            .input('quantity', sql.Int, parseInt(quantity, 10))
            .input('unitPrice', sql.Decimal(10, 2), unitPrice)
            .input('subtotal', sql.Decimal(10, 2), subtotal)
            .input('total', sql.Decimal(10, 2), total)
            .input('firstName', sql.NVarChar, firstName)
            .input('lastName', sql.NVarChar, lastName)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone || null)
            .input('addressLine1', sql.NVarChar, addressLine1 || null)
            .input('addressLine2', sql.NVarChar, addressLine2 || null)
            .input('city', sql.NVarChar, city || null)
            .input('stateProvince', sql.NVarChar, stateProvince || null)
            .input('zipCode', sql.NVarChar, zipCode || null)
            .input('billingSame', sql.Bit, billingSameAsContact ? 1 : 0)
            .input('billingFullName', sql.NVarChar, billingFullName || null)
            .input('billingAddress1', sql.NVarChar, billingAddress1 || null)
            .input('billingAddress2', sql.NVarChar, billingAddress2 || null)
            .input('billingCity', sql.NVarChar, billingCity || null)
            .input('billingState', sql.NVarChar, billingState || null)
            .input('billingZip', sql.NVarChar, billingZip || null)
            .input('cardLastFour', sql.NVarChar, cardLastFour || null)
            .query(Q.insertBooking);

        res.status(201).json({ success: true, bookingId: result.recordset[0].EventBookingID });
    } catch (error) {
        console.error('Error creating event booking:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET event bookings list (admin table)
router.get('/api/event-bookings', async (req, res) => {
    try {
        const pool = await connectToDb();
        const limit = parseInt(req.query.limit || 100, 10);
        const offset = parseInt(req.query.offset || 0, 10);
        const search = req.query.search || '';
        const dateFrom = req.query.dateFrom || '';
        const dateTo = req.query.dateTo || '';

        let conditions = '';
        if (search) conditions += ` AND (eb.FirstName LIKE @search OR eb.LastName LIKE @search OR eb.Email LIKE @search OR e.EventName LIKE @search)`;
        if (dateFrom) conditions += ` AND eb.PlacedAt >= @dateFrom`;
        if (dateTo) conditions += ` AND eb.PlacedAt <= @dateTo`;

        const mkReq = () => {
            const r = pool.request();
            if (search) r.input('search', sql.NVarChar, `%${search}%`);
            if (dateFrom) r.input('dateFrom', sql.NVarChar, dateFrom);
            if (dateTo) r.input('dateTo', sql.NVarChar, dateTo);
            return r;
        };

        const [rowsRes, countRes] = await Promise.all([
            mkReq()
                .input('limit', sql.Int, limit)
                .input('offset', sql.Int, offset)
                .query(Q.listBookings(conditions)),
            mkReq().query(Q.countBookings(conditions)),
        ]);

        const rows = rowsRes.recordset.map(row => ({
            ...row,
            FullName: `${row.FirstName} ${row.LastName}`.trim(),
        }));

        res.json({ rows, total: countRes.recordset[0].total });
    } catch (error) {
        console.error('Error fetching event bookings:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET single event booking detail (admin modal)
router.get('/api/event-bookings/:id', async (req, res) => {
    try {
        const pool = await connectToDb();
        const result = await pool.request()
            .input('id', sql.Int, parseInt(req.params.id, 10))
            .query(Q.getBookingById);
        if (!result.recordset.length) return res.status(404).json({ error: 'Booking not found.' });
        const row = result.recordset[0];
        res.json({
            ...row,
            FullName: `${row.FirstName} ${row.LastName}`.trim(),
        });
    } catch (error) {
        console.error('Error fetching event booking detail:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
