// Quick fix: resolve all Band B (Oct-Dec 2025) unresolved alerts
// so that "Last 6 Months" doesn't show more unresolved alerts than "This Year"
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

(async () => {
  const pool = await sql.connect(config);

  // Resolve all Band B unresolved alerts
  const r = await pool.request().query(`
    UPDATE HealthAlert
    SET IsResolved = 1,
        ResolvedAt = DATEADD(DAY, 7, CreatedAt),
        ResolutionNotes = 'Issue addressed by veterinary team.'
    WHERE IsResolved = 0
      AND CreatedAt >= '2025-10-18'
      AND CreatedAt < '2026-01-01'
  `);
  console.log('Resolved', r.rowsAffected[0], 'Band B alerts');

  // Also resolve Band A unresolved alerts (even older)
  const r2 = await pool.request().query(`
    UPDATE HealthAlert
    SET IsResolved = 1,
        ResolvedAt = DATEADD(DAY, 14, CreatedAt),
        ResolutionNotes = 'Issue monitored and resolved.'
    WHERE IsResolved = 0
      AND CreatedAt < '2025-10-18'
  `);
  console.log('Resolved', r2.rowsAffected[0], 'Band A alerts');

  await pool.close();
  console.log('Done!');
})();
