const connectDB = require('../db');
const Message = require('../models/Message');
const { logAudit } = require('../utils/auditLogger');

exports.getMyMessages = async (req, res) => {
    try {
        await connectDB();
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: "Email parameter is required" });

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
