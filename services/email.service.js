const nodemailer = require('nodemailer');
const config = require('../config');

// Setup Nodemailer transport connecting to Mailtrap or similar via loaded keys
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465, // true for 465, false for other ports
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

const sendEmail = async (to, subject, html) => {
  if (config.env === 'test') { return; } // Don't block testing environments over missing keys
  
  const mailOptions = {
    from: config.smtp.from,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error);
  }
};

const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to FêteSalle DZ!';
  const html = `<h2>Welcome ${name}</h2><p>Thank you for joining our platform. We hope you enjoy our platform for venue reservations across Algeria!</p>`;
  await sendEmail(email, subject, html);
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const subject = 'Password Reset Request';
  const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;
  const html = `<p>You requested a password reset. Click the link below to set a new password:</p>
                <a href="${resetUrl}">Reset Password</a>`;
  await sendEmail(email, subject, html);
};

const sendBookingConfirmedEmail = async (email, booking) => {
  const subject = 'Your Booking is Confirmed';
  const html = `<h3>Booking Confirmed!</h3><p>Your reservation for on ${new Date(booking.eventDate).toLocaleDateString()} has successfully been confirmed.</p>`;
  await sendEmail(email, subject, html);
};

const sendBookingCancelledEmail = async (email, booking) => {
  const subject = 'Booking Cancelled';
  const html = `<p>Your booking for ${new Date(booking.eventDate).toLocaleDateString()} was cancelled effectively.</p>`;
  await sendEmail(email, subject, html);
};

const sendEventReminderEmail = async (email, booking) => {
  const subject = 'Reminder: Upcoming Event Tomorrow';
  const html = `<p>This is a reminder that your event booking for ${booking.listing.title} is scheduled for tomorrow.</p>`;
  await sendEmail(email, subject, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
  sendEventReminderEmail,
};
