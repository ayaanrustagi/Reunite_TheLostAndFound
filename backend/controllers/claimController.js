const connectDB = require('../db');
const Claim = require('../models/Claim');

exports.getAllClaims = async (req, res) => {
    try {
        await connectDB();
        const claims = await Claim.find({}).sort({ created_at: -1 }).lean();
        const mappedClaims = claims.map(c => ({ ...c, id: c._id }));
        res.json(mappedClaims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.upsertClaim = async (req, res) => {
    try {
        await connectDB();
        const claimData = req.body;
        const id = claimData.id || claimData._id;

        if (!id) return res.status(400).json({ error: "ID is required" });

        const updateData = { ...claimData, _id: id };
        delete updateData.id;

        const updated = await Claim.findOneAndUpdate(
            { _id: id },
            updateData,
            { upsert: true, returnDocument: 'after', lean: true, setDefaultsOnInsert: true }
        );

        res.json({ ...updated, id: updated._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteClaim = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        await Claim.deleteOne({ _id: id });
        res.json({ message: "Claim deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
