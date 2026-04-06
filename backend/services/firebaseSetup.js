const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        // Load service account directly from environment variable (best for Azure)
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized with service account from env var.');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        // Resolve path relative to backend root directory (one level up from services/)
        const path = require('path');
        const backendRoot = path.resolve(__dirname, '..');
        const serviceAccountPath = path.resolve(backendRoot, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        console.log(`Loading Firebase service account from: ${serviceAccountPath}`);
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized with service account file.');
    } else {
        admin.initializeApp({
            projectId: 'wildwoods-zoo-auth-v1'
        });
        console.log('Firebase Admin initialized with projectId: wildwoods-zoo-auth-v1');
    }
} catch (error) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed:', error.message);
    console.error(error);
}

module.exports = admin;
