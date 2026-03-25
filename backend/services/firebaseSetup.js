const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
// In production, use a service account key JSON file path or environment variables.
// For testing using default credentials if running in a Google Cloud environment or just using the mock setup:
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        // Resolve path relative to backend root directory
        const path = require('path');
        const serviceAccountPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        const serviceAccount = require(serviceAccountPath);
        
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
    console.error('CRITICAL: Firebase Admin SDK initialization failed:', error.message);
    // Print the full stack so developers can see why it failed
    console.error(error);
}

module.exports = admin;
