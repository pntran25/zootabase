// Check the distribution of StaffSchedule data across time bands
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

  const r = await pool.request().query(`
    SELECT
      CASE
        WHEN WorkDate >= DATEADD(DAY, -30, GETDATE()) THEN 'Last 30 Days'
        WHEN WorkDate >= DATEADD(DAY, -90, GETDATE()) THEN '31-90 Days Ago'
        WHEN WorkDate >= DATEADD(MONTH, -6, GETDATE()) THEN '91 Days - 6 Months'
        WHEN WorkDate >= DATEADD(YEAR, -1, GETDATE()) THEN '6-12 Months Ago'
        ELSE 'Older than 1 Year'
      END AS TimeBand,
      COUNT(*) AS ShiftCount,
      MIN(WorkDate) AS MinDate,
      MAX(WorkDate) AS MaxDate
    FROM StaffSchedule
    WHERE DeletedAt IS NULL
    GROUP BY
      CASE
        WHEN WorkDate >= DATEADD(DAY, -30, GETDATE()) THEN 'Last 30 Days'
        WHEN WorkDate >= DATEADD(DAY, -90, GETDATE()) THEN '31-90 Days Ago'
        WHEN WorkDate >= DATEADD(MONTH, -6, GETDATE()) THEN '91 Days - 6 Months'
        WHEN WorkDate >= DATEADD(YEAR, -1, GETDATE()) THEN '6-12 Months Ago'
        ELSE 'Older than 1 Year'
      END
    ORDER BY MIN(WorkDate) DESC
  `);

  console.log('\nStaffSchedule Distribution:');
  console.table(r.recordset);

  const total = await pool.request().query(`SELECT COUNT(*) AS Total FROM StaffSchedule WHERE DeletedAt IS NULL`);
  console.log('Total schedules:', total.recordset[0].Total);

  await pool.close();
})();
