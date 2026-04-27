const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
    {
        provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        description: { type: String, required: true, maxlength: 2000 },
        category: { type: String, required: true, enum: ['venue', 'photographer', 'dj', 'caterer', 'decorator', 'other'] },
        subcategory: { type: String, maxlength: 60 },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }, // [longitude, latitude]
        },
        address: {
            street: { type: String },
            city: { type: String, required: true },
            wilaya: { type: String, required: true },
            postalCode: { type: String },
        },
        coverImageUrl: { type: String },
        imageUrls: [{ type: String }], // max 10
        panoramaUrls: [{ type: String }], // max 3
        priceRange: {
            min: { type: Number, required: true, min: 0 },
            max: { type: Number, required: true },
            currency: { type: String, default: 'DZD' },
        },
        capacity: {
            min: { type: Number, default: 1 },
            max: { type: Number },
        },
        amenities: [{ type: String }],
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: false },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

listingSchema.index({ location: '2dsphere' });
listingSchema.index({ category: 1, isActive: 1, isVerified: 1 });
listingSchema.index({ provider: 1 });
listingSchema.index({ rating: -1 });
listingSchema.index({ 'address.wilaya': 1 });

listingSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'listing',
});

module.exports = mongoose.model('Listing', listingSchema);
