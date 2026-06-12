const db = require('../db');

exports.getAllClaims = async (req, res) => {
    try {
        const claims = await db.claims.find({}).sort({ created_at: -1 });
        const mappedClaims = claims.map(c => ({ ...c, id: c._id }));
        res.json(mappedClaims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.upsertClaim = async (req, res) => {
    try {
        const claimData = req.body;
        const id = claimData.id || claimData._id;

        if (!id) return res.status(400).json({ error: "ID is required" });

        const updateData = { ...claimData, _id: id };
        delete updateData.id;

        await db.claims.update({ _id: id }, updateData, { upsert: true });
        const updated = await db.claims.findOne({ _id: id });

        res.json({ ...updated, id: updated._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteClaim = async (req, res) => {
    try {
        const { id } = req.params;
        await db.claims.remove({ _id: id });
        res.json({ message: "Claim deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
