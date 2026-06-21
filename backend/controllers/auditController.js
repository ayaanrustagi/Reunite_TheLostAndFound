const connectDB = require('../db');
const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
    try {
        await connectDB();
        const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(100).lean();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 