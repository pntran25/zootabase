const sql = require('mssql');
require('dotenv').config();

async function main() {
    const pool = await sql.connect(process.env.DB_CONNECTION_STRING || {
        server: process.env.DB_SERVER,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        options: { encrypt: true, trustServerCertificate: true }
    });
    const res = await pool.request().query('SELECT StaffID FROM Staff');
    const ids = res.recordset.map(r => r.StaffID);
    
    const now = new Date();
    const past = new Date(now.getFullYear() - 3, 0, 1); // 3 years ago
    
    for (let i = 0; i < ids.length; i++) {
        let dateVal;
        if (i % 5 === 0) {
            // Force ~20% to be 'This Week' or 'This Month' so standard filters work
            dateVal = new Date(now.getTime() - Math.random() * (14 * 24 * 60 * 60 * 1000));
        } else {
            const span = now.getTime() - past.getTime();
            dateVal = new Date(past.getTime() + Math.random() * span);
        }
        
        const year = dateVal.getFullYear();
        const month = (dateVal.getMonth() + 1).toString().padStart(2, '0');
        const day = dateVal.getDate().toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        await pool.request().query(`UPDATE Staff SET HireDate = '${dateStr}' WHERE StaffID = ${ids[i]}`);
    }
    console.log('Re-Randomized ' + ids.length + ' hire dates to include recent hires');
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
