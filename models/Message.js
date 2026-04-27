const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        thread: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread', required: true, index: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, maxlength: 2000 },
        type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
        imageUrl: { type: String },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

messageSchema.index({ thread: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
