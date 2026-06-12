const db = require('../db');

exports.getAllItems = async (req, res) => {
    try {
        const items = await db.items.find({}).sort({ created_at: -1 });
        // Map _id back to id for frontend compatibility
        const mappedItems = items.map(it => ({ ...it, id: it._id }));
        res.json(mappedItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.upsertItem = async (req, res) => {
    try {
        const itemData = req.body;
        const id = itemData.id || itemData._id;

        if (!id) return res.status(400).json({ error: "ID is required" });

        const updateData = { ...itemData, _id: id };
        delete updateData.id;

        await db.items.update({ _id: id }, updateData, { upsert: true });
        const updated = await db.items.findOne({ _id: id });

        res.json({ ...updated, id: updated._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        await db.items.remove({ _id: id });
        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
