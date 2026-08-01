const connectDB = require('../db');
const BoxStatus = require('../models/BoxStatus');
const { logAudit } = require('../utils/auditLogger');
const { sendBoxFullAlert } = require('../utils/mailer');

const ALERT_THRESHOLD = Number(process.env.BOX_ALERT_THRESHOLD) || 75; // percent
const ALERT_COOLDOWN_MS = (Number(process.env.BOX_ALERT_COOLDOWN_HOURS) || 4) * 60 * 60 * 1000;
const HISTORY_LIMIT = 200; // keep the sparkline data bounded

exports.getBoxStatus = async (req, res) => {
    try {
        await connectDB();
        const boxes = await BoxStatus.find({}).sort({ updatedAt: -1 }).lean();
        res.json(boxes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.postBoxStatus = async (req, res) => {
    try {
        await connectDB();
        const { deviceId, fillPercent, location } = req.body;

        if (!deviceId || fillPercent === undefined) {
            return res.status(400).json({ error: 'deviceId and fillPercent are required' });
        }

        const clamped = Math.max(0, Math.min(100, Number(fillPercent)));
        const existing = await BoxStatus.findOne({ deviceId });

        const history = existing?.history || [];
        history.push({ fillPercent: clamped, recordedAt: new Date() });
        if (history.length > HISTORY_LIMIT) history.shift();

        const updated = await BoxStatus.findOneAndUpdate(
            { deviceId },
            {
                deviceId,
                fillPercent: clamped,
                location: location || existing?.location || '',
                updatedAt: new Date(),
                history
            },
            { upsert: true, returnDocument: 'after' }
        );

        // Threshold alert with cooldown so a hovering-near-full box doesn't spam email.
        const hoursSinceAlert = updated.lastAlertAt
            ? (Date.now() - new Date(updated.lastAlertAt).getTime())
            : Infinity;

        if (clamped >= ALERT_THRESHOLD && hoursSinceAlert > ALERT_COOLDOWN_MS) {
            const result = await sendBoxFullAlert({ deviceId, fillPercent: clamped, location: updated.location });

            await BoxStatus.updateOne({ deviceId }, { lastAlertAt: new Date() });

            await logAudit({
                userId: 'system',
                userEmail: 'sensor@reunite',
                action: 'BOX_ALERT_TRIGGERED',
                resourceType: 'BoxStatus',
                resourceId: deviceId,
                details: { fillPercent: clamped, emailSent: result.sent }
            });
        }

        res.json({ ok: true, deviceId, fillPercent: clamped });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
