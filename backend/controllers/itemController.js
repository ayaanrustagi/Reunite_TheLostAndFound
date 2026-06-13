const connectDB = require('../db');
const Item = require('../models/Item');

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

        const updated = await Item.findOneAndUpdate(
            { _id: id },
            updateData,
            { upsert: true, returnDocument: 'after', lean: true, setDefaultsOnInsert: true }
        );

        res.json({ ...updated, id: updated._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        await Item.deleteOne({ _id: id });
        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
