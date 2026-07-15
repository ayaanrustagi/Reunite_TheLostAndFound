/**
 * @file AuditLog.js
 * @description Mongoose schema definition for the AuditLog model.
 * Records critical system events, actions, and entities modified for security auditing.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

const mongoose = require('mongoose');

/**
 * Audit Log Schema Definition
 * 
 * @property {String} userId - The user identifier who triggered the action
 * @property {String} userEmail - The email address of the user who triggered the action
 * @property {String} action - The action type (e.g. 'USER_LOGIN', 'ITEM_CREATE', 'CLAIM_DELETE')
 * @property {String} resourceType - The type of resource involved (e.g. 'User', 'Item', 'Claim', 'Message')
 * @property {String} resourceId - The specific identifier of the targeted resource
 * @property {Object} details - Arbitrary key-value metadata storing details of the transaction
 * @property {Date} timestamp - Date object capturing when the log was written (defaults to Date.now)
 */
const auditLogSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: false
});

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

   