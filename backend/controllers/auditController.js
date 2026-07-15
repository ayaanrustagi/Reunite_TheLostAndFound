/**
 * @file auditController.js
 * @description Controller handling system security audit log retrieval.
 * Provides historical logs to verify actions performed in the app.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

const connectDB = require('../db');
const AuditLog = require('../models/AuditLog');

/**
 * Retrieve the 100 most recent system audit logs, sorted chronologically in descending order.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getAuditLogs = async (req, res) => {
    try {
        await connectDB();
        const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(100).lean();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve audit logs.' });
    }
};

   