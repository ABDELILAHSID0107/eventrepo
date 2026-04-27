const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
        listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
        client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, maxlength: 1000, trim: true },
        isPublic: { type: Boolean, default: true },
    },
    { timestamps: true }
);

reviewSchema.post('save', async function () {
    const Listing = mongoose.model('Listing');
    const stats = await this.constructor.aggregate([
        { $match: { listing: this.listing, isPublic: true } },
        { $group: { _id: '$listing', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
        await Listing.findByIdAndUpdate(this.listing, {
            rating: Math.round(stats[0].avgRating * 10) / 10,
            reviewCount: stats[0].count,
        });
    } else {
        await Listing.findByIdAndUpdate(this.listing, { rating: 0, reviewCount: 0 });
    }
});

module.exports = mongoose.model('Review', reviewSchema);
