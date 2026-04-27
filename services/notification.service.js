const admin = require('firebase-admin');
const { getIo } = require('../config/socket');
const User = require('../models/User');

const sendPushNotification = async (userId, payload) => {
  try {
    const user = await User.findById(userId).select('fcmTokens');
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return;

    // Use sendEachForMulticast via firebase SDK
    const message = {
      tokens: user.fcmTokens,
      notification: payload.notification,
      data: payload.data || {},
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Clean up stale or inactive FCM tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error.code;
          if (errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered') {
            failedTokens.push(user.fcmTokens[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        user.fcmTokens = user.fcmTokens.filter(token => !failedTokens.includes(token));
        await user.save();
      }
    }
  } catch (error) {
    if (error.code && error.code.startsWith('app/')) {
       // Firebase Admin may not be properly initialized in Dev modes
       console.warn('[Notification Service] Firebase Push Error:', error.message);
    } else {
       console.error('[Notification Service] Push Notification failed:', error);
    }
  }
};

const sendRealtimeNotification = (userId, eventType, data) => {
  try {
    const io = getIo();
    // Assuming socket.io notifications namespace rooms use UserID mappings natively
    io.of('/notifications').to(userId.toString()).emit(eventType, data);
  } catch (error) {
    console.error('[Notification Service] Socket.io emit error preventing real-time alert:', error);
  }
};

const notifyUser = async (userId, notificationOptions) => {
  // 1. Dispatch into local socket connections active immediately 
  sendRealtimeNotification(userId, notificationOptions.eventType, notificationOptions.data);

  // 2. Dispatch to Mobile Phones / OS-level notification APIs safely offline
  await sendPushNotification(userId, {
    notification: {
      title: notificationOptions.title,
      body: notificationOptions.body,
    },
    data: notificationOptions.pushData // Record IDs or Deep Linking URIs inside
  });
};

module.exports = {
  sendPushNotification,
  sendRealtimeNotification,
  notifyUser
};
