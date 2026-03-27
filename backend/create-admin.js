require('dotenv').config();
const sql = require('mssql');
const { poolPromise } = require('./services/admin');
const admin = require('firebase-admin');

// Initialize Firebase Admin (uses our new projectId config)
if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'wildwoods-zoo-auth-v1' });
}

const createSuperAdmin = async () => {
    try {
        console.log('Connecting to database...');
        const pool = await poolPromise;

        const email = 'admin@wildwoods.zoo';
        const password = 'Password123!';
        const firstName = 'System';
        const lastName = 'Admin';
        
        console.log(`Checking if Firebase user ${email} exists...`);
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().getUserByEmail(email);
            console.log('User already exists in Firebase.');
            // Let's drop it and recreate just to be safe with password
            await admin.auth().deleteUser(firebaseUser.uid);
            console.log('Deleted existing Firebase user to recreate.');
        } catch (e) {
            if (e.code !== 'auth/user-not-found') throw e;
        }

        console.log('Creating Firebase User...');
        firebaseUser = await admin.auth().createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`
        });
        console.log(`Firebase User created with UID: ${firebaseUser.uid}`);

        console.log('Syncing to SQL Staff table...');
        const checkRes = await pool.request().query(`SELECT StaffID FROM Staff WHERE Email = '${email}'`);
        if (checkRes.recordset.length > 0) {
            console.log('Admin already exists in Staff table. Updating UID...');
            await pool.request().query(`
                UPDATE Staff 
                SET FirebaseUid = '${firebaseUser.uid}', Role = 'Super Admin'
                WHERE Email = '${email}'
            `);
        } else {
            console.log('Inserting new Admin into Staff table...');
            await pool.request().query(`
                INSERT INTO Staff (FirstName, LastName, Email, Role, FirebaseUid)
                VALUES ('${firstName}', '${lastName}', '${email}', 'Super Admin', '${firebaseUser.uid}')
            `);
        }

        console.log('\n--- SUPER ADMIN CREATED SUCCESSFULLY ---');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('----------------------------------------');
        process.exit(0);
    } catch (e) {
        console.error('Failed to create super admin:', e);
        process.exit(1);
    }
};

createSuperAdmin();
