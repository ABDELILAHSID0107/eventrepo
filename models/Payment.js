const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
        client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        chargilyCheckoutId: { type: String, required: true, unique: true },
        chargilyPaymentId: { type: String },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'DZD' },
        status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
        method: { type: String },
        paidAt: { type: Date },
        metadata: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

paymentSchema.index({ chargilyCheckoutId: 1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
