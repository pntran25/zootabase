const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
// In production, use a service account key JSON file path or environment variables.
// For testing using default credentials if running in a Google Cloud environment or just using the mock setup:
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized with service account.');
    } else {
        // Fallback or explicit projectId config
        admin.initializeApp({
            projectId: 'wildwoods-zoo-auth-v1'
        });
        console.log('Firebase Admin initialized with projectId: wildwoods-zoo-auth-v1');
    }
} catch (error) {
    console.warn('Firebase Admin SDK initialization warning:', error.message);
}

module.exports = admin;
