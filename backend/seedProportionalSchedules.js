/**
 * Seed proportional StaffSchedule data so that shift counts scale
 * logically with time-range filters.
 *
 * Target: ~600 shifts/month across all months.
 * Current state: 729 shifts in last 30 days, only 64 in 31-90 day range.
 *
 * We need to add shifts to these bands:
 *   31-90 days ago  (Jan 18 - Mar 18):  need ~1200 total, have 64 → add ~1136
 *   91 days - 6m    (Oct 18 - Jan 17):  need ~1800 total, have 67 → add ~1733
 *   6m - 12m        (Apr 18 2025 - Oct 17): need ~3600 total, have 40 → add ~3560
 *
 * The varied shift durations per band ensure Avg Hours/Shift also changes.
 *
 * Usage: node seedProportionalSchedules.js
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

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randDate = (start, end) => {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString().split('T')[0];
};

async function run() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Connected to database.');

    const staff = (await pool.request().query(
      `SELECT StaffID FROM Staff WHERE DeletedAt IS NULL`
    )).recordset;
    const exhibits = (await pool.request().query(
      `SELECT ExhibitID FROM Exhibit WHERE DeletedAt IS NULL`
    )).recordset;

    const staffIds = staff.map(s => s.StaffID);
    const exhibitIds = exhibits.map(e => e.ExhibitID);
    console.log(`Found ${staffIds.length} staff, ${exhibitIds.length} exhibits.`);

    // Shift patterns with varied durations per band
    // Band 1 (31-90 days ago): standard 8h shifts
    const band1Shifts = [
      { start: '06:00', end: '14:00' },  // 8h
      { start: '07:00', end: '15:00' },  // 8h
      { start: '08:00', end: '16:00' },  // 8h
      { start: '09:00', end: '17:00' },  // 8h
      { start: '10:00', end: '18:00' },  // 8h
      { start: '14:00', end: '22:00' },  // 8h
    ];

    // Band 2 (91 days - 6 months): longer shifts ~9-10h avg
    const band2Shifts = [
      { start: '06:00', end: '16:00' },  // 10h
      { start: '07:00', end: '17:00' },  // 10h
      { start: '06:00', end: '15:00' },  // 9h
      { start: '08:00', end: '17:00' },  // 9h
      { start: '09:00', end: '18:00' },  // 9h
      { start: '14:00', end: '23:00' },  // 9h
    ];

    // Band 3 (6-12 months ago): shorter shifts ~6h avg
    const band3Shifts = [
      { start: '08:00', end: '14:00' },  // 6h
      { start: '06:00', end: '12:00' },  // 6h
      { start: '09:00', end: '14:00' },  // 5h
      { start: '07:00', end: '14:00' },  // 7h
      { start: '10:00', end: '16:00' },  // 6h
      { start: '13:00', end: '19:00' },  // 6h
    ];

    const bands = [
      { name: '31-90 days ago', start: '2026-01-18', end: '2026-03-18', count: 1100, shifts: band1Shifts },
      { name: '91d - 6 months', start: '2025-10-18', end: '2026-01-17', count: 1700, shifts: band2Shifts },
      { name: '6-12 months ago', start: '2025-04-18', end: '2025-10-17', count: 3500, shifts: band3Shifts },
    ];

    let totalInserted = 0;

    for (const band of bands) {
      console.log(`\nSeeding ${band.name}: ${band.count} shifts...`);
      let inserted = 0;

      // Batch insert in groups of 50 for performance
      for (let i = 0; i < band.count; i++) {
        const sid = pick(staffIds);
        const workDate = randDate(band.start, band.end);
        const shift = pick(band.shifts);
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
        inserted++;

        if (inserted % 500 === 0) {
          console.log(`  ...${inserted}/${band.count}`);
        }
      }
      console.log(`  ✅ Inserted ${inserted} shifts for ${band.name}`);
      totalInserted += inserted;
    }

    console.log(`\n✅ Done! Inserted ${totalInserted} total new schedule entries.`);

    // Verify new distribution
    const verify = await pool.request().query(`
      SELECT
        CASE
          WHEN WorkDate >= DATEADD(DAY, -30, GETDATE()) THEN 'Last 30 Days'
          WHEN WorkDate >= DATEADD(DAY, -90, GETDATE()) THEN '31-90 Days Ago'
          WHEN WorkDate >= DATEADD(MONTH, -6, GETDATE()) THEN '91 Days - 6 Months'
          WHEN WorkDate >= DATEADD(YEAR, -1, GETDATE()) THEN '6-12 Months Ago'
          ELSE 'Older'
        END AS TimeBand,
        COUNT(*) AS ShiftCount
      FROM StaffSchedule
      WHERE DeletedAt IS NULL
      GROUP BY
        CASE
          WHEN WorkDate >= DATEADD(DAY, -30, GETDATE()) THEN 'Last 30 Days'
          WHEN WorkDate >= DATEADD(DAY, -90, GETDATE()) THEN '31-90 Days Ago'
          WHEN WorkDate >= DATEADD(MONTH, -6, GETDATE()) THEN '91 Days - 6 Months'
          WHEN WorkDate >= DATEADD(YEAR, -1, GETDATE()) THEN '6-12 Months Ago'
          ELSE 'Older'
        END
      ORDER BY MIN(WorkDate) DESC
    `);
    console.log('\nNew distribution:');
    console.table(verify.recordset);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

run();
