const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ], // exactly 2
        listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
        lastMessage: { type: String },
        lastMessageAt: { type: Date },
        unreadCount: { type: Map, of: Number, default: {} },
    },
    { timestamps: true }
);

chatThreadSchema.index({ participants: 1 });
chatThreadSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('ChatThread', chatThreadSchema);
