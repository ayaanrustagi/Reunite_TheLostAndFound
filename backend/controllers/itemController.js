const connectDB = require('../db');
const Item = require('../models/Item');
const { logAudit } = require('../utils/auditLogger');

exports.getAllItems = async (req, res) => {
    try {
        await connectDB();
        const items = await Item.find({}).sort({ created_at: -1 }).lean();
        // Map _id back to id for frontend compatibility
        const mappedItems = items.map(it => ({ ...it, id: it._id }));
        res.json(mappedItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.upsertItem = async (req, res) => {
    try {
        await connectDB();
        const itemData = req.body;
        const id = itemData.id || itemData._id;

        if (!id) return res.status(400).json({ error: "ID is required" });

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
        res.status(400).json({ error: err.message });
    }
};

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

        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
 