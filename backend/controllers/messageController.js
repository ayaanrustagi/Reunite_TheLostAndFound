/**
 * @file messageController.js
 * @description Controller handling message sending and fetching.
 * Restricts user message querying to owner-only or admin-level access for system-inbox verification.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

const connectDB = require('../db');
const Message = require('../models/Message');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

/**
 * Retrieve messages for the current user.
 * Authorizes the query: users can only fetch their own messages, while admins can access
 * messages sent to the admin email ('admin@reunite.com').
 * 
 * @param {Object} req - Express request object containing query params 'email' and 'requester_id' (or header 'x-user-id')
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getMyMessages = async (req, res) => {
    try {
        await connectDB();
        const { email } = req.query;
        const requester_id = req.headers['x-user-id'] || req.query.requester_id;

        if (!email) return res.status(400).json({ error: 'Email parameter is required.' });
        if (!requester_id) return res.status(401).json({ error: 'Authentication required.' });

        // Verify that the requester ID matches the email being queried, or is an admin querying system messages
        const user = await User.findOne({ _id: requester_id }).lean();
        const isAuthorized = user && (user.email === email || (user.role === 'admin' && email === 'admin@reunite.com'));
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Unauthorized access to messages.' });
        }

        const messages = await Message.find({ recipient_email: email }).sort({ created_at: -1 }).lean();
        const mappedMessages = messages.map(m => ({ ...m, id: m._id }));
        res.json(mappedMessages);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve messages.' });
    }
};

/**
 * Create or send a message (upsert).
 * Logs the MESSAGE_SEND action in the system audit logs.
 * 
 * @param {Object} req - Express request object containing message body
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.createMessage = async (req, res) => {
    try {
        await connectDB();
        const msgData = req.body;
        const id = msgData.id || msgData._id;

        if (!id) return res.status(400).json({ error: 'ID is required.' });

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
        res.status(400).json({ error: 'Failed to send message.' });
    }
};

