require('dotenv').config();
const sql = require('mssql');
const { poolPromise } = require('./services/admin');

async function createSuperAdmin() {
    try {
        const pool = await poolPromise;
        const email = 'admin@wildwoods.zoo';
        const password = 'Password123!';
        
        console.log('Registering user directly via Firebase REST API...');
        const apiKey = "AIzaSyBoOAjwPlK6LXoj-v1yAYwIoTLf1na31hs"; // The key we got earlier

        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true })
        });
        
        const data = await response.json();
        if (data.error) {
            if (data.error.message === 'EMAIL_EXISTS') {
                console.log('Email already exists. Attempting login to get UID...');
                const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, returnSecureToken: true })
                });
                const loginData = await loginRes.json();
                if (loginData.error) throw new Error(loginData.error.message);
                data.localId = loginData.localId;
            } else {
                throw new Error(data.error.message);
            }
        }
        
        const uid = data.localId;
        console.log(`Firebase UID: ${uid}`);

        console.log('Linking to SQL Database...');
        const checkRes = await pool.request().query(`SELECT StaffID FROM Staff WHERE Email = '${email}'`);
        if (checkRes.recordset.length > 0) {
            await pool.request().query(`
                UPDATE Staff 
                SET FirebaseUid = '${uid}', Role = 'Super Admin'
                WHERE Email = '${email}'
            `);
        } else {
            await pool.request().query(`
                INSERT INTO Staff (FirstName, LastName, Email, Role, FirebaseUid)
                VALUES ('System', 'Admin', '${email}', 'Super Admin', '${uid}')
            `);
        }

        console.log('\n--- SUCCESS ---');
        console.log(`Log in at http://localhost:3000/login`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        process.exit(0);

    } catch(err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

createSuperAdmin();
