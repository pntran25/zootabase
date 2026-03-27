require('dotenv').config();
const sql = require('mssql');
const { connectToDb } = require('./services/admin');

async function insertAdmin() {
    try {
        const pool = await connectToDb();
        const email = 'jawadhasanhemani@gmail.com';
        
        console.log('Dropping old constraint...');
        try {
            await pool.request().query("ALTER TABLE Staff DROP CONSTRAINT CK_Staff_Role");
            console.log('Dropped constraint CK_Staff_Role.');
        } catch (e) {
            console.log('Constraint may not exist or already dropped.', e.message);
        }

        const checkRes = await pool.request().query(`SELECT StaffID FROM Staff WHERE Email = '${email}'`);
        if (checkRes.recordset.length > 0) {
            await pool.request().query(`
                UPDATE Staff 
                SET Role = 'Super Admin'
                WHERE Email = '${email}'
            `);
            console.log('Updated existing record.');
        } else {
            await pool.request().query(`
                INSERT INTO Staff (FirstName, LastName, FullName, Email, Role, Salary, HireDate)
                VALUES ('Jawad', 'Hemani', 'Jawad Hemani', '${email}', 'Super Admin', 100000.00, GETDATE())
            `);
            console.log('Inserted new record.');
        }

    } catch(err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

insertAdmin();
