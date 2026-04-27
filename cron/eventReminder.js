const cron = require('node-cron');
const Booking = require('../models/Booking');
const notificationService = require('../services/notification.service');
const emailService = require('../services/email.service');

// Run daily at 9:00 AM
const startEventReminderCron = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      const upcomingBookings = await Booking.find({
        status: { $in: ['confirmed', 'in_progress'] },
        eventDate: {
          $gte: tomorrow,
          $lt: endOfTomorrow
        }
      }).populate('client', 'fcmTokens email firstName')
        .populate('provider', 'fcmTokens email firstName')
        .populate('listing', 'title');

      if (upcomingBookings.length > 0) {
        console.log(`[Cron] Found ${upcomingBookings.length} upcoming events for tomorrow. Sending reminders...`);
        for (const booking of upcomingBookings) {
          // Remind Client via Email & Push
          if (booking.client && booking.client.email) {
            await emailService.sendEventReminderEmail(booking.client.email, booking);
          }
          await notificationService.notifyUser(booking.client._id, {
            eventType: 'event_reminder',
            title: 'Upcoming Event Tomorrow!',
            body: `Your reservation at ${booking.listing.title} is scheduled for tomorrow.`,
            pushData: { bookingId: booking._id.toString() }
          });

          // Remind Provider via Push
          await notificationService.notifyUser(booking.provider._id, {
            eventType: 'event_reminder',
            title: 'Event Reminder',
            body: `You are hosting an event at ${booking.listing.title} tomorrow.`,
            pushData: { bookingId: booking._id.toString() }
          });
        }
      }
    } catch (error) {
      console.error('[Cron] Error in eventReminder cron job:', error);
    }
  });
};

module.exports = { startEventReminderCron };
