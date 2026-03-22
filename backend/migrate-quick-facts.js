require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: { encrypt: true, trustServerCertificate: false }
};

(async () => {
  try {
    const pool = await sql.connect(config);
    await pool.request().query(`
      IF COL_LENGTH('Animal', 'Lifespan') IS NULL
        ALTER TABLE Animal ADD Lifespan NVARCHAR(50);
      IF COL_LENGTH('Animal', 'Weight') IS NULL
        ALTER TABLE Animal ADD Weight NVARCHAR(50);
      IF COL_LENGTH('Animal', 'Region') IS NULL
        ALTER TABLE Animal ADD Region NVARCHAR(100);
      IF COL_LENGTH('Animal', 'FunFact') IS NULL
        ALTER TABLE Animal ADD FunFact NVARCHAR(255);
    `);
    console.log('Quick Facts columns added successfully!');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  }
})();
