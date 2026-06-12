const db = require('../db');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.users.findOne({ email });

        if (!user) return res.status(404).json({ error: "User not found" });
        if (user.password !== password) return res.status(401).json({ error: "Invalid password" });

        res.json({
            id: user._id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.register = async (req, res) => {
    try {
        const userData = req.body;
        const id = userData.id || userData._id;

        if (!id) return res.status(400).json({ error: "ID required" });

        const existing = await db.users.findOne({ email: userData.email });
        if (existing) return res.status(400).json({ error: "User already exists" });

        const newUserData = {
            _id: id,
            email: userData.email,
            full_name: userData.full_name,
            password: userData.password,
            role: userData.role,
            created_at: new Date().toISOString()
        };

        const inserted = await db.users.insert(newUserData);

        res.status(201).json({
            id: inserted._id,
            email: inserted.email,
            full_name: inserted.full_name,
            role: inserted.role
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: "Email required" });

        const user = await db.users.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({
            id: user._id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            password: user.password
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
