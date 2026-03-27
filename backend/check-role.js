require('dotenv').config();
const { connectToDb } = require('./services/admin');

async function check() {
    try {
        const pool = await connectToDb();
        const staff = await pool.request().query("SELECT StaffID, Email, Role, FirebaseUid, DeletedAt FROM Staff WHERE Email = 'jawadhasanhemani@gmail.com'");
        console.log(staff.recordset);
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
