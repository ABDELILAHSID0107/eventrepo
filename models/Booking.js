const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
        eventDate: { type: Date, required: true },
        eventEndDate: { type: Date },
        guestCount: { type: Number, min: 1 },
        specialRequests: { type: String, maxlength: 500 },
        addOns: [
            {
                listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
                category: { type: String },
                title: { type: String },
                price: { type: Number },
            },
        ],
        status: {
            type: String,
            enum: ['pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'],
            default: 'pending_payment',
        },
        totalPrice: { type: Number, required: true },
        depositAmount: { type: Number, required: true },
        commissionAmount: { type: Number, required: true },
        commissionPaid: { type: Boolean, default: false },
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
        chargilyCheckoutId: { type: String },
        cancellationReason: { type: String },
        cancelledBy: { type: String, enum: ['client', 'provider', 'admin', 'system'] },
        expiresAt: { type: Date },
        completedAt: { type: Date },
        reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
    },
    { timestamps: true }
);

bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ listing: 1, eventDate: 1 });
bookingSchema.index({ expiresAt: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
