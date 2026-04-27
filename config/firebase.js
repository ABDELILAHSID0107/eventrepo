const admin = require('firebase-admin');
const config = require('./index');

if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });
    console.log('[Firebase] Admin SDK initialized successfully');
  } catch (error) {
    console.error('[Firebase] Failed to initialize Admin SDK:', error.message);
  }
} else {
  console.warn('[Firebase] Missing Firebase Credentials. Firebase services will be disabled.');
}

module.exports = admin;
