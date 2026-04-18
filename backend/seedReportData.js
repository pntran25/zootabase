/**
 * Seed script – populate HealthAlert, AnimalHealthRecord, and StaffSchedule
 * with time-distributed data so that the date-range filters on the Overview
 * dashboards show meaningfully different numbers for 30 d / 90 d / 6 m / YTD.
 *
 * Usage: node seedReportData.js
 *
 * All dates ≤ 2026-04-18.  No future dates.
 */

const sql = require('mssql');
require('dotenv').config();

const config = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port:     parseInt(process.env.DB_PORT) || 1433,
  options:  { encrypt: true, trustServerCertificate: false },
};

// ── Helpers ──────────────────────────────────────────────────────────

/** Random int in [min, max] */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Pick random item from array */
const pick = (arr) => arr[randInt(0, arr.length - 1)];

/** Random date string between two ISO dates */
const randDate = (start, end) => {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString().split('T')[0];
};

/** Format HH:MM */
const hhmm = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

// ── Constants ────────────────────────────────────────────────────────

const ALERT_TYPES = [
  'Weight Loss', 'Low Activity', 'Missed Feeding', 'Abnormal Behavior',
  'Temperature Alert', 'Appetite Decline', 'Injury Detected', 'Dehydration Risk',
];

const ALERT_MESSAGES = {
  'Weight Loss':        (n) => `${n} has lost more than 5% body weight in the last 2 weeks.`,
  'Low Activity':       (n) => `${n} activity level has been unusually low for 3 consecutive days.`,
  'Missed Feeding':     (n) => `${n} missed scheduled feeding for 2 consecutive sessions.`,
  'Abnormal Behavior':  (n) => `Keeper reported unusual pacing behavior for ${n}.`,
  'Temperature Alert':  (n) => `${n} body temperature outside normal range during routine check.`,
  'Appetite Decline':   (n) => `${n} has shown reduced appetite over the past week.`,
  'Injury Detected':    (n) => `Minor abrasion detected on ${n} during health inspection.`,
  'Dehydration Risk':   (n) => `${n} showing signs of dehydration; increased water intake recommended.`,
};

const MEDICAL_CONDITIONS = [
  'None', 'Mild arthritis', 'Skin irritation', 'Minor wound healing',
  'Dental issue', 'Respiratory concern', 'Eye infection', 'Parasite treatment',
];

const TREATMENTS = [
  'Routine vaccination', 'Antibiotic course', 'Wound care', 'Dental cleaning',
  'Parasite treatment', 'Physical therapy', 'Dietary supplement', 'None',
];

const ACTIVITY_LEVELS = ['High', 'Normal', 'Low', 'Sedentary'];
const APPETITE_STATUS = ['Excellent', 'Good', 'Fair', 'Poor'];

// ─────────────────────────────────────────────────────────────────────

async function run() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Connected to database.');

    // 1. Fetch existing animal IDs + names
    const animals = (await pool.request().query(
      `SELECT AnimalID, Name FROM Animal WHERE DeletedAt IS NULL`
    )).recordset;
    if (animals.length === 0) throw new Error('No animals found!');
    console.log(`Found ${animals.length} animals.`);

    // 2. Fetch existing staff IDs
    const staff = (await pool.request().query(
      `SELECT StaffID FROM Staff WHERE DeletedAt IS NULL`
    )).recordset;
    if (staff.length === 0) throw new Error('No staff found!');
    console.log(`Found ${staff.length} staff members.`);

    // 3. Fetch existing exhibit IDs for schedule assignments
    const exhibits = (await pool.request().query(
      `SELECT ExhibitID FROM Exhibit WHERE DeletedAt IS NULL`
    )).recordset;
    console.log(`Found ${exhibits.length} exhibits.`);

    const staffIds   = staff.map(s => s.StaffID);
    const exhibitIds = exhibits.map(e => e.ExhibitID);

    // ──────────────────────────────────────────────────────────
    // DATE BUCKETS (designed so each filter shows different data)
    //
    //   "Last 30 Days"  = 2026-03-19 → 2026-04-18
    //   "Last 90 Days"  = 2026-01-18 → 2026-04-18
    //   "Last 6 Months" = 2025-10-18 → 2026-04-18
    //   "This Year"     = 2026-01-01 → 2026-04-18
    //
    // We generate data in 4 bands:
    //   Band A: 2025-07-01 → 2025-10-17   (only in "Last 6 Months")
    //   Band B: 2025-10-18 → 2025-12-31   (in 6m but NOT "This Year")
    //   Band C: 2026-01-01 → 2026-03-18   (in YTD + 90d but NOT 30d)
    //   Band D: 2026-03-19 → 2026-04-18   (in all filters)
    // ──────────────────────────────────────────────────────────

    const bands = [
      { name: 'A', start: '2025-07-01', end: '2025-10-17' },
      { name: 'B', start: '2025-10-18', end: '2025-12-31' },
      { name: 'C', start: '2026-01-01', end: '2026-03-18' },
      { name: 'D', start: '2026-03-19', end: '2026-04-18' },
    ];

    // ── 3a. Seed HealthAlert ─────────────────────────────────

    console.log('\nSeeding HealthAlert...');
    let alertCount = 0;
    for (const band of bands) {
      // More alerts in recent bands
      const n = band.name === 'A' ? 8 : band.name === 'B' ? 10 : band.name === 'C' ? 14 : 12;
      for (let i = 0; i < n; i++) {
        const animal = pick(animals);
        const type = pick(ALERT_TYPES);
        const message = ALERT_MESSAGES[type](animal.Name);
        const createdAt = randDate(band.start, band.end);
        // Older alerts more likely resolved
        const isResolved = band.name === 'D' ? (Math.random() < 0.3 ? 1 : 0) :
                           band.name === 'C' ? (Math.random() < 0.5 ? 1 : 0) :
                           (Math.random() < 0.8 ? 1 : 0);
        const resolvedAt = isResolved
          ? randDate(createdAt, band.end < '2026-04-18' ? band.end : '2026-04-18')
          : null;
        const resolutionNotes = isResolved ? 'Issue addressed by veterinary team.' : null;

        await pool.request()
          .input('animalId',       sql.Int,          animal.AnimalID)
          .input('alertType',      sql.NVarChar(100), type)
          .input('alertMessage',   sql.NVarChar(500), message)
          .input('createdAt',      sql.DateTime,      new Date(createdAt))
          .input('isResolved',     sql.Bit,           isResolved)
          .input('resolvedAt',     sql.DateTime,      resolvedAt ? new Date(resolvedAt) : null)
          .input('resolutionNotes',sql.NVarChar(500), resolutionNotes)
          .query(`INSERT INTO HealthAlert (AnimalID, AlertType, AlertMessage, CreatedAt, IsResolved, ResolvedAt, ResolutionNotes)
                  VALUES (@animalId, @alertType, @alertMessage, @createdAt, @isResolved, @resolvedAt, @resolutionNotes)`);
        alertCount++;
      }
    }
    console.log(`  Inserted ${alertCount} health alerts.`);

    // ── 3b. Seed AnimalHealthRecord ──────────────────────────

    console.log('Seeding AnimalHealthRecord...');
    let recordCount = 0;
    for (const band of bands) {
      // More checkups recently
      const n = band.name === 'A' ? 15 : band.name === 'B' ? 20 : band.name === 'C' ? 30 : 25;
      for (let i = 0; i < n; i++) {
        const animal = pick(animals);
        const checkupDate = randDate(band.start, band.end);
        const healthScore = randInt(30, 100);
        const notes = healthScore < 50 ? 'Requires follow-up treatment.' :
                      healthScore < 70 ? 'Minor concerns noted during exam.' :
                      healthScore < 90 ? 'Animal in good condition.' :
                      'Excellent health. No concerns.';
        const weight = (randInt(50, 5000) / 10).toFixed(1);
        const wLow = (parseFloat(weight) * 0.9).toFixed(1);
        const wHigh = (parseFloat(weight) * 1.1).toFixed(1);
        const activityLevel = pick(ACTIVITY_LEVELS);
        const appetite = pick(APPETITE_STATUS);
        const medicalConditions = pick(MEDICAL_CONDITIONS);
        const treatments = pick(TREATMENTS);
        const staffId = pick(staffIds);

        await pool.request()
          .input('animalId',         sql.Int,          animal.AnimalID)
          .input('checkupDate',      sql.Date,         checkupDate)
          .input('healthScore',      sql.Int,          healthScore)
          .input('notes',            sql.NVarChar(500), notes)
          .input('staffId',          sql.Int,          staffId)
          .input('activityLevel',    sql.NVarChar(50),  activityLevel)
          .input('weight',           sql.Decimal(10,2), parseFloat(weight))
          .input('weightRangeLow',   sql.Decimal(10,2), parseFloat(wLow))
          .input('weightRangeHigh',  sql.Decimal(10,2), parseFloat(wHigh))
          .input('medicalConditions',sql.NVarChar(500), medicalConditions)
          .input('recentTreatments', sql.NVarChar(500), treatments)
          .input('appetiteStatus',   sql.NVarChar(50),  appetite)
          .input('createdAt',        sql.DateTime,      new Date(checkupDate))
          .query(`INSERT INTO AnimalHealthRecord
                    (AnimalID, CheckupDate, HealthScore, Notes, StaffID,
                     ActivityLevel, Weight, WeightRangeLow, WeightRangeHigh,
                     MedicalConditions, RecentTreatments, AppetiteStatus, CreatedAt)
                  VALUES
                    (@animalId, @checkupDate, @healthScore, @notes, @staffId,
                     @activityLevel, @weight, @weightRangeLow, @weightRangeHigh,
                     @medicalConditions, @recentTreatments, @appetiteStatus, @createdAt)`);
        recordCount++;
      }
    }
    console.log(`  Inserted ${recordCount} health records.`);

    // ── 3c. Seed StaffSchedule ───────────────────────────────

    console.log('Seeding StaffSchedule...');
    let schedCount = 0;

    // Typical shift patterns
    const SHIFTS = [
      { start: '06:00', end: '14:00' },
      { start: '07:00', end: '15:00' },
      { start: '08:00', end: '16:00' },
      { start: '09:00', end: '17:00' },
      { start: '10:00', end: '18:00' },
      { start: '14:00', end: '22:00' },
    ];

    for (const band of bands) {
      // Fewer schedules in older bands, more in recent ones
      const n = band.name === 'A' ? 40 : band.name === 'B' ? 50 : band.name === 'C' ? 80 : 60;
      for (let i = 0; i < n; i++) {
        const sid = pick(staffIds);
        const workDate = randDate(band.start, band.end);
        const shift = pick(SHIFTS);
        const exhibitId = exhibitIds.length > 0 ? pick(exhibitIds) : null;

        const req = pool.request()
          .input('staffId',    sql.Int,          sid)
          .input('workDate',   sql.Date,         workDate)
          .input('shiftStart', sql.NVarChar(10), shift.start)
          .input('shiftEnd',   sql.NVarChar(10), shift.end)
          .input('createdAt',  sql.DateTime,     new Date(workDate));

        let q;
        if (exhibitId) {
          req.input('exhibitId', sql.Int, exhibitId);
          q = `INSERT INTO StaffSchedule (StaffID, WorkDate, ShiftStart, ShiftEnd, AssignedExhibitID, CreatedAt)
               VALUES (@staffId, @workDate, @shiftStart, @shiftEnd, @exhibitId, @createdAt)`;
        } else {
          q = `INSERT INTO StaffSchedule (StaffID, WorkDate, ShiftStart, ShiftEnd, CreatedAt)
               VALUES (@staffId, @workDate, @shiftStart, @shiftEnd, @createdAt)`;
        }

        await req.query(q);
        schedCount++;
      }
    }
    console.log(`  Inserted ${schedCount} staff schedule entries.`);

    console.log('\n✅ Seeding complete!');
    console.log(`  ${alertCount} HealthAlert rows`);
    console.log(`  ${recordCount} AnimalHealthRecord rows`);
    console.log(`  ${schedCount} StaffSchedule rows`);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

run();
