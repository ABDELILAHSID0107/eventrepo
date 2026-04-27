const { startBookingExpiryCron } = require('./bookingExpiry');
const { startEventReminderCron } = require('./eventReminder');

const initCrons = () => {
  // Start all scheduled jobs
  startBookingExpiryCron();
  startEventReminderCron();
  console.log('[Cron] Initialized cron jobs');
};

module.exports = initCrons;
