const mongoose = require('mongoose');

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
