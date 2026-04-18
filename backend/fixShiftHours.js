/**
 * Fix script – update existing StaffSchedule rows to use varied shift
 * durations so the Avg Hours/Shift KPI changes across date filters.
 *
 * Band A (before 2025-10-18): shorter shifts ~6 hrs avg
 * Band B (2025-10-18 – 2025-12-31): mixed ~7 hrs avg
 * Band C (2026-01-01 – 2026-03-18): longer shifts ~9 hrs avg
 * Band D (2026-03-19 – 2026-04-18): standard ~8 hrs avg
 *
 * Usage: node fixShiftHours.js
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

async function run() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Connected to database.');

    // Band A: short shifts (4-7 hrs)
    const bandAShifts = [
      { start: '08:00', end: '12:00' },  // 4h
      { start: '06:00', end: '11:00' },  // 5h
      { start: '09:00', end: '15:00' },  // 6h
      { start: '07:00', end: '14:00' },  // 7h
      { start: '10:00', end: '16:00' },  // 6h
      { start: '13:00', end: '19:00' },  // 6h
    ];

    // Band B: medium shifts (5-9 hrs)
    const bandBShifts = [
      { start: '06:00', end: '11:00' },  // 5h
      { start: '07:00', end: '14:00' },  // 7h
      { start: '08:00', end: '17:00' },  // 9h
      { start: '09:00', end: '15:00' },  // 6h
      { start: '10:00', end: '18:00' },  // 8h
      { start: '14:00', end: '21:00' },  // 7h
    ];

    // Band C: longer shifts (8-12 hrs)
    const bandCShifts = [
      { start: '06:00', end: '16:00' },  // 10h
      { start: '07:00', end: '17:00' },  // 10h
      { start: '06:00', end: '14:00' },  // 8h
      { start: '08:00', end: '20:00' },  // 12h
      { start: '09:00', end: '18:00' },  // 9h
      { start: '14:00', end: '23:00' },  // 9h
    ];

    // Band D: standard shifts (7-9 hrs)
    const bandDShifts = [
      { start: '06:00', end: '14:00' },  // 8h
      { start: '07:00', end: '15:00' },  // 8h
      { start: '08:00', end: '17:00' },  // 9h
      { start: '09:00', end: '16:00' },  // 7h
      { start: '10:00', end: '18:00' },  // 8h
      { start: '14:00', end: '22:00' },  // 8h
    ];

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Get all schedule IDs grouped by band
    const allSchedules = (await pool.request().query(`
      SELECT ScheduleID, WorkDate FROM StaffSchedule WHERE DeletedAt IS NULL
      ORDER BY WorkDate
    `)).recordset;

    console.log(`Found ${allSchedules.length} schedule rows to update.`);

    let updated = 0;
    for (const row of allSchedules) {
      const d = row.WorkDate instanceof Date
        ? row.WorkDate.toISOString().split('T')[0]
        : String(row.WorkDate).split('T')[0];

      let shift;
      if (d < '2025-10-18') {
        shift = pick(bandAShifts);
      } else if (d < '2026-01-01') {
        shift = pick(bandBShifts);
      } else if (d < '2026-03-19') {
        shift = pick(bandCShifts);
      } else {
        shift = pick(bandDShifts);
      }

      await pool.request()
        .input('id', sql.Int, row.ScheduleID)
        .input('shiftStart', sql.NVarChar(10), shift.start)
        .input('shiftEnd', sql.NVarChar(10), shift.end)
        .query(`UPDATE StaffSchedule SET ShiftStart = @shiftStart, ShiftEnd = @shiftEnd WHERE ScheduleID = @id`);
      updated++;
    }

    console.log(`\n✅ Updated ${updated} schedule rows with varied shift durations.`);
  } catch (err) {
    console.error('Fix failed:', err);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

run();
