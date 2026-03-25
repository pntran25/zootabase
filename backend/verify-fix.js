require('dotenv').config();
const { connectToDb } = require('./services/admin');

async function verify() {
    try {
        const pool = await connectToDb();
        const email = 'jawadhasanhemani@gmail.com';
        
        console.log('--- Checking Staff ---');
        const staff = await pool.request().input('Email', email).query(`SELECT StaffID, Email, Role, FirebaseUid, DeletedAt FROM Staff WHERE Email = @Email`);
        console.log(staff.recordset);
        
        console.log('--- Checking Customer ---');
        const cust = await pool.request().input('Email', email).query(`SELECT CustomerID, Email, FirebaseUid FROM Customer WHERE Email = @Email`);
        console.log(cust.recordset);
        
        console.log('--- Checking Customer constraints ---');
        const constraints = await pool.request().query(`
            SELECT tc.CONSTRAINT_NAME, tc.CONSTRAINT_TYPE, ccu.COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu ON tc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
            WHERE tc.TABLE_NAME = 'Customer'
        `);
        console.log(constraints.recordset.filter(c => c.CONSTRAINT_TYPE === 'UNIQUE'));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
verify();
