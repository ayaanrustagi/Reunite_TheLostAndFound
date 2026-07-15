/**
 * @file Message.js
 * @description Mongoose schema definition for the Message model.
 * Stores system and user communications regarding items.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

const mongoose = require('mongoose');

/**
 * Message Schema Definition
 * 
 * @property {String} _id - Unique identifier for the message (typically UUID or custom string)
 * @property {String} item_id - Reference to the corresponding Item ID the message relates to
 * @property {String} item_title - Title/name of the referenced item
 * @property {String} sender_name - Name of the message sender
 * @property {String} sender_email - Email address of the message sender
 * @property {String} recipient_email - Email address of the message recipient
 * @property {String} message - The textual body of the message
 * @property {String} created_at - ISO 8601 creation timestamp string
 */
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

