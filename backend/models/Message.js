const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    item_id: String,
    item_title: String,
    sender_name: String,
    sender_email: String,
    recipient_email: String,
    message: String,
    created_at: { type: String, default: () => new Date().toISOString() }
}, {
    _id: false,
    strict: false,
    timestamps: false
});

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
