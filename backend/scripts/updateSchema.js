const { connectToDb } = require('../services/admin');

async function updateSchema() {
    try {
        console.log("Connecting to database...");
        const pool = await connectToDb();
        
        console.log("Checking if ImageUrl column exists...");
        const checkQuery = `
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Exhibit' AND COLUMN_NAME = 'ImageUrl'
        `;
        const result = await pool.request().query(checkQuery);
        
        if (result.recordset.length === 0) {
            console.log("Adding ImageUrl column to Exhibit table...");
            await pool.request().query(`
                ALTER TABLE Exhibit ADD ImageUrl NVARCHAR(255) NULL
            `);
            console.log("Column added successfully!");
        } else {
            console.log("ImageUrl column already exists.");
        }
        
        process.exit(0);
    } catch (err) {
        console.error("Schema update failed:", err);
        process.exit(1);
    }
}

updateSchema();
