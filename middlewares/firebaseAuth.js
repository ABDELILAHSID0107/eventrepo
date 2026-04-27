const admin = require('firebase-admin');
const ApiError = require('../utils/ApiError');

const firebaseAuth = async (req, res, next) => {
    try {
        let idToken;
    
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            idToken = req.headers.authorization.split(' ')[1];
        } else if (req.body && req.body.firebaseIdToken) {
            idToken = req.body.firebaseIdToken;
        }

        if (!idToken) {
            return next(new ApiError(401, 'No Firebase ID token provided.'));
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Pass the decoded Firebase user to the next middleware
        req.firebaseUser = decodedToken;
        next();
    } catch (error) {
        console.error('Firebase Auth Error:', error);
        return next(new ApiError(401, 'Invalid Firebase ID token.'));
    }
};

module.exports = firebaseAuth;
