require('dotenv').config();
const sql = require('mssql');
const { connectToDb } = require('./services/admin');

async function migrateAnimalTable() {
  try {
    const pool = await connectToDb();
    console.log('Connected, running migration...');
    
    // Check if columns exist before adding them
    const checkQuery = `
      IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'ImageUrl' AND Object_ID = Object_ID(N'Animal'))
      BEGIN
          ALTER TABLE Animal ADD ImageUrl NVARCHAR(255) NULL;
      END

      IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'Diet' AND Object_ID = Object_ID(N'Animal'))
      BEGIN
          ALTER TABLE Animal ADD Diet NVARCHAR(100) NULL;
      END

      IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'HealthStatus' AND Object_ID = Object_ID(N'Animal'))
      BEGIN
          ALTER TABLE Animal ADD HealthStatus NVARCHAR(50) NULL;
      END
    `;
    
    await pool.request().query(checkQuery);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrateAnimalTable();
