const connectDB = require('../db');
const Message = require('../models/Message');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

exports.getMyMessages = async (req, res) => {
    try {
        await connectDB();
        const { email } = req.query;
        const requester_id = req.headers['x-user-id'] || req.query.requester_id;

        if (!email) return res.status(400).json({ error: "Email parameter is required" });
        if (!requester_id) return res.status(401).json({ error: "Authentication required" });

        // Verify that the requester ID matches the email being queried
        const user = await User.findOne({ _id: requester_id }).lean();
        if (!user || user.email !== email) {
            return res.status(403).json({ error: "Unauthorized access to messages" });
        }

        const messages = await Message.find({ recipient_email: email }).sort({ created_at: -1 }).lean();
        const mappedMessages = messages.map(m => ({ ...m, id: m._id }));
        res.json(mappedMessages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createMessage = async (req, res) => {
    try {
        await connectDB();
        const msgData = req.body;
        const id = msgData.id || msgData._id;

        if (!id) return res.status(400).json({ error: "ID is required" });

        const updateData = { ...msgData, _id: id };
        delete updateData.id;

        const created = await Message.findOneAndUpdate(
            { _id: id },
            updateData,
            { upsert: true, returnDocument: 'after', lean: true, setDefaultsOnInsert: true }
        );

        // Audit Log
        const requester = msgData._requester || { id: 'system', email: msgData.sender_email || 'system' };

        await logAudit({
            userId: requester.id,
            userEmail: requester.email,
            action: 'MESSAGE_SEND',
            resourceType: 'Message',
            resourceId: id,
            details: {
                item_id: created.item_id,
                recipient_email: created.recipient_email
            }
        });

        res.json({ ...created, id: created._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
