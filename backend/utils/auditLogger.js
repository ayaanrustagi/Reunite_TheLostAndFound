const connectDB = require('../db');
const AuditLog = require('../models/AuditLog');

const logAudit = async ({ userId, userEmail, action, resourceType, resourceId, details }) => {
    try {
        await connectDB();
        const log = new AuditLog({
            userId,
            userEmail,
            action,
            resourceType,
            resourceId,
            details,
            timestamp: new Date()
        });
        await log.save();
        console.log(`[AUDIT] Action: ${action} | User: ${userEmail} | Resource: ${resourceType} (${resourceId})`);
    } catch (error) {
        console.error('Failed to log audit:', error);
    }
};

module.exports = { logAudit };
  