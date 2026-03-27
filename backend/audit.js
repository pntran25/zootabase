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
    // get latest staff logins
    const staffRes = await pool.request().query("SELECT TOP 5 sla.LoginID, sla.StaffID, s.Email, s.FirstName, sla.LoginTime FROM StaffLoginAudit sla JOIN Staff s ON sla.StaffID = s.StaffID ORDER BY sla.LoginTime DESC");
    console.log('RECENT STAFF LOGINS:', staffRes.recordset);
    process.exit(0);
}
run().catch(console.error);
