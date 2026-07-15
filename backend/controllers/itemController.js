/**
 * @file itemController.js
 * @description Controller handling operations on lost and found items, including retrieval, creation, updates, and deletion.
 * Supports audit logs to capture system-wide item modification events.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

const connectDB = require('../db');
const Item = require('../models/Item');
const { logAudit } = require('../utils/auditLogger');

/**
 * Retrieve all items sorted by creation timestamp in descending order.
 * Maps the Mongoose _id field to the standard id field for frontend consumption.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getAllItems = async (req, res) => {
    try {
        await connectDB();
        const items = await Item.find({}).sort({ created_at: -1 }).lean();
        const mappedItems = items.map(it => ({ ...it, id: it._id }));
        res.json(mappedItems);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve items.' });
    }
};

/**
 * Create or update an item (upsert).
 * Audits the item lifecycle actions (ITEM_CREATE or ITEM_UPDATE) with detailed metadata.
 * 
 * @param {Object} req - Express request containing the item properties in body
 * @param {Object} res - Express response
 * @returns {Promise<void>}
 */
exports.upsertItem = async (req, res) => {
    try {
        await connectDB();
        const itemData = req.body;
        const id = itemData.id || itemData._id;

        if (!id) return res.status(400).json({ error: 'ID is required.' });

        const updateData = { ...itemData, _id: id };
        delete updateData.id;

        const existing = await Item.findById(id).lean();
        const action = existing ? 'ITEM_UPDATE' : 'ITEM_CREATE';

        const updated = await Item.findOneAndUpdate(
            { _id: id },
            updateData,
            { upsert: true, returnDocument: 'after', lean: true, setDefaultsOnInsert: true }
        );

        // Audit Log
        const requester = itemData._requester || { id: itemData.created_by || 'system', email: itemData.contact_email || 'system' };

        await logAudit({
            userId: requester.id,
            userEmail: requester.email,
            action: action,
            resourceType: 'Item',
            resourceId: id,
            details: {
                title: updated.title,
                status: updated.status,
                category: updated.category
            }
        });

        res.json({ ...updated, id: updated._id });
    } catch (err) {
        res.status(400).json({ error: 'Failed to save item.' });
    }
};

/**
 * Delete an item by its ID. Logs the deletion activity including the item title to the audit system.
 * 
 * @param {Object} req - Express request object containing path parameter 'id'
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.deleteItem = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { requester_id, requester_email } = req.query;

        const item = await Item.findById(id).lean();

        await Item.deleteOne({ _id: id });

        await logAudit({
            userId: requester_id || 'system',
            userEmail: requester_email || 'system',
            action: 'ITEM_DELETE',
            resourceType: 'Item',
            resourceId: id,
            details: { title: item ? item.title : 'Unknown' }
        });

        res.json({ message: 'Item deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete item.' });
    }
};

   