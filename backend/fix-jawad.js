require('dotenv').config();
const { connectToDb } = require('./services/admin');

async function check() {
    try {
        const pool = await connectToDb();
        const email = 'jawadhasanhemani@gmail.com';
        
        console.log('Restoring Staff record...');
        await pool.request().input('Email', email).query(`UPDATE Staff SET DeletedAt = NULL WHERE Email = @Email`);
        
        console.log('Transferring Firebase UID to Staff...');
        const custResult = await pool.request().input('Email', email).query(`SELECT FirebaseUid FROM Customer WHERE Email = @Email`);
        if (custResult.recordset.length > 0 && custResult.recordset[0].FirebaseUid) {
            const uid = custResult.recordset[0].FirebaseUid;
            await pool.request().input('Email', email).input('Uid', uid).query(`UPDATE Staff SET FirebaseUid = @Uid WHERE Email = @Email`);
            await pool.request().input('Email', email).query(`UPDATE Customer SET FirebaseUid = NULL WHERE Email = @Email`);
            console.log('Firebase Uid transferred successfully.');
        } else {
            console.log('No Customer record or Firebase Uid found.');
        }
        
        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
