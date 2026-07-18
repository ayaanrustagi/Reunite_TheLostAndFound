/**
 * @file Claim.js
 * @description Mongoose schema definition for the Claim model.
 * Models a claim requested by a user on a found item, storing proof and status details.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

const mongoose = require('mongoose');

/**
 * Claim Schema Definition
 * 
 * @property {String} _id - Unique identifier for the claim (typically UUID or custom string)
 * @property {String} item_id - Reference to the corresponding Item ID being claimed
 * @property {String} claimer_name - Name of the person filing the claim
 * @property {String} claimer_email - Contact email of the claimer
 * @property {String} claimer_phone - Contact phone number of the claimer
 * @property {String} description - Owner's description/details verifying ownership
 * @property {String} proof_image - Base64 encoded or URL representation of proof of ownership
 * @property {String} status - Current status of the claim ('pending', 'approved', 'rejected')
 * @property {String} created_at - ISO 8601 creation timestamp string
 * @property {String} created_by - User ID of the claimer
 */
const claimSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    item_id: { type: String, index: true },
    claimer_name: String,
    claimer_email: String,
    claimer_phone: String,
    description: String,
    proof_image: String,
    status: { type: String, default: 'pending' },
    created_at: { type: String, default: () => new Date().toISOString(), index: -1 },
    created_by: String
}, {
    _id: false,
    strict: false,
    timestamps: false
});

module.exports = mongoose.models.Claim || mongoose.model('Claim', claimSchema);

   