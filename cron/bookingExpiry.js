const cron = require('node-cron');
const Booking = require('../models/Booking');

// Run every 5 minutes
const startBookingExpiryCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      
      const expiredBookings = await Booking.find({
        status: 'pending_payment',
        expiresAt: { $lte: now }
      });

      if (expiredBookings.length > 0) {
        console.log(`[Cron] Found ${expiredBookings.length} expired bookings. Cancelling...`);
        for (const booking of expiredBookings) {
          booking.status = 'cancelled';
          booking.cancelledBy = 'system';
          booking.cancellationReason = 'Payment window expired';
          await booking.save();
        }
      }
    } catch (error) {
      console.error('[Cron] Error in bookingExpiry cron job:', error);
    }
  });
};

module.exports = { startBookingExpiryCron };
