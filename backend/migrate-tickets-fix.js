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
        
        // 1. Drop the UNIQUE constraint on TypeName
        console.log('Dropping UNIQUE constraint on TypeName...');
        const uniqueConstraint = await sql.query(`
            SELECT name 
            FROM sys.indexes 
            WHERE object_id = OBJECT_ID('TicketType') AND index_id > 0 AND is_unique_constraint = 1
        `);
        
        if (uniqueConstraint.recordset.length > 0) {
            const constraintName = uniqueConstraint.recordset[0].name;
            await sql.query(`ALTER TABLE TicketType DROP CONSTRAINT ${constraintName}`);
            console.log(`Dropped UNIQUE constraint: ${constraintName}`);
        } else {
            console.log('No unique constraint on TypeName found.');
        }

        // 1.5. Drop the CHECK constraint on TypeName
        console.log('Dropping CHECK constraint on TypeName...');
        const checkConstraint = await sql.query(`
            SELECT name 
            FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('TicketType') AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('TicketType'), 'TypeName', 'ColumnId')
        `);
        
        if (checkConstraint.recordset.length > 0) {
            const constraintName = checkConstraint.recordset[0].name;
            await sql.query(`ALTER TABLE TicketType DROP CONSTRAINT ${constraintName}`);
            console.log(`Dropped CHECK constraint: ${constraintName}`);
        } else {
            console.log('No check constraint on TypeName found.');
        }

        // 2. Add Category column
        console.log('Adding Category column to TicketType...');
        const checkCat = await sql.query(`SELECT COL_LENGTH('TicketType', 'Category') as catLen`);
        if (checkCat.recordset[0].catLen == null) {
            await sql.query(`ALTER TABLE TicketType ADD Category NVARCHAR(30) NULL;`);
            console.log('Added Category column.');
            
            // Migrate existing Types to Categories and rename their TypeName to look like the mock UI
            await sql.query(`UPDATE TicketType SET Category = TypeName WHERE Category IS NULL;`);
            await sql.query(`UPDATE TicketType SET TypeName = 'General Admission - Adult' WHERE Category = 'General';`);
            await sql.query(`UPDATE TicketType SET TypeName = 'General Admission - Child' WHERE Category = 'Child';`);
            await sql.query(`UPDATE TicketType SET TypeName = 'VIP Early Access' WHERE Category = 'VIP';`);
            await sql.query(`UPDATE TicketType SET TypeName = 'Special Event Access' WHERE Category = 'Event';`);
        } else {
            console.log('Category column already exists.');
        }

        console.log('Ticket Migration Fix completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sql.close();
    }
}

migrate();
