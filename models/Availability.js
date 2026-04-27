const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
    {
        listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
        provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true },
        timeSlots: [
            {
                start: { type: String }, // "09:00"
                end: { type: String }, // "17:00"
                isBooked: { type: Boolean, default: false },
                bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
            },
        ],
        isFullDayBlocked: { type: Boolean, default: false },
        note: { type: String, maxlength: 200 },
    },
    { timestamps: true }
);

availabilitySchema.index({ listing: 1, date: 1 }, { unique: true });
availabilitySchema.index({ provider: 1, date: 1 });

module.exports = mongoose.model('Availability', availabilitySchema);
