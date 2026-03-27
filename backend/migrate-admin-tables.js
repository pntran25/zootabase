const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: false,
    }
};

async function migrate() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to Azure SQL Database');

        // 1. Add SKU to Product table if it doesn't exist
        console.log('Checking Product table for SKU column...');
        const skuCheck = await sql.query(`SELECT COL_LENGTH('Product', 'SKU') as skuLen`);
        if (skuCheck.recordset[0].skuLen == null) {
            await sql.query(`ALTER TABLE Product ADD SKU NVARCHAR(50) NULL;`);
            console.log('Added SKU column to Product table.');
            await sql.query(`UPDATE Product SET SKU = 'SKU-000' + CAST(ProductID AS NVARCHAR(10)) WHERE SKU IS NULL;`);
        } else {
            console.log('SKU column already exists in Product table.');
        }

        // 2. Add BasePrice and Description to TicketType if they don't exist
        console.log('Checking TicketType table for new columns...');
        const ttCheck = await sql.query(`SELECT COL_LENGTH('TicketType', 'BasePrice') as bpLen`);
        if (ttCheck.recordset[0].bpLen == null) {
            await sql.query(`
                ALTER TABLE TicketType ADD BasePrice DECIMAL(10,2) NULL;
                ALTER TABLE TicketType ADD Description NVARCHAR(255) NULL;
            `);
            console.log('Added BasePrice and Description columns to TicketType table.');
            
            // Initialize defaults based on the UI mock data
            await sql.query(`UPDATE TicketType SET BasePrice = 25.00, Description = 'Single day access for guests 13-64' WHERE TypeName = 'General';`);
            await sql.query(`UPDATE TicketType SET BasePrice = 15.00, Description = 'Single day access for guests 3-12' WHERE TypeName = 'Child';`);
            await sql.query(`UPDATE TicketType SET BasePrice = 50.00, Description = 'Includes early morning entry' WHERE TypeName = 'VIP';`);
            await sql.query(`UPDATE TicketType SET BasePrice = 35.00, Description = 'Entry for specific scheduled events' WHERE TypeName = 'Event';`);
        } else {
            console.log('BasePrice and Description columns already exist in TicketType table.');
        }
        
        // Ensure default TicketTypes exist
        console.log('Ensuring default TicketTypes exist...');
        const typesToEnsure = ['General', 'Child', 'VIP', 'Event'];
        for (const typeName of typesToEnsure) {
            await sql.query(`
                IF NOT EXISTS (SELECT 1 FROM TicketType WHERE TypeName = '${typeName}')
                BEGIN
                    INSERT INTO TicketType (TypeName, BasePrice, Description) VALUES ('${typeName}', 0.00, 'Default Description');
                END
            `);
        }

        // 3. Create GuestFeedback table if it doesn't exist
        console.log('Checking GuestFeedback table...');
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GuestFeedback')
            BEGIN
                CREATE TABLE GuestFeedback (
                    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
                    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
                    Comment NVARCHAR(1000) NULL,
                    LocationTag NVARCHAR(100) NULL,
                    DateSubmitted DATE NOT NULL DEFAULT CONVERT(DATE, GETUTCDATE()),
                    CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
                );
                PRINT 'Created GuestFeedback table.';
            END
            ELSE
            BEGIN
                PRINT 'GuestFeedback table already exists.';
            END
        `);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sql.close();
    }
}

migrate();
