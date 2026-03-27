require('dotenv').config();
const sql = require('mssql');
async function run() {
    const pool = await sql.connect({
        server: process.env.DB_SERVER,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT),
        options: { encrypt: true, trustServerCertificate: false }
    });
    const custRes = await pool.request().query("SELECT CustomerID, FullName, Email, FirebaseUid FROM Customer WHERE Email LIKE '%jawad%'");
    console.log('CUSTOMERS:', custRes.recordset);
    const staffRes = await pool.request().query("SELECT StaffID, FirstName, LastName, Email, FirebaseUid FROM Staff WHERE Email LIKE '%jawad%'");
    console.log('STAFF:', staffRes.recordset);
    process.exit(0);
}
run().catch(console.error);
