const connectDB = require('../db');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

exports.login = async (req, res) => {
    try {
        await connectDB();
        const { email, password } = req.body;
        const user = await User.findOne({ email }).lean();

        if (!user) return res.status(404).json({ error: "User not found" });
        if (user.password !== password) return res.status(401).json({ error: "Invalid password" });

        await logAudit({
            userId: user._id,
            userEmail: user.email,
            action: 'USER_LOGIN',
            resourceType: 'User',
            resourceId: user._id,
            details: { role: user.role }
        });

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
        await connectDB();
        const userData = req.body;
        const id = userData.id || userData._id;

        if (!id) return res.status(400).json({ error: "ID required" });

        const existing = await User.findOne({ email: userData.email }).lean();
        if (existing) return res.status(400).json({ error: "User already exists" });

        // Secure Role Assignment
        let userRole = 'student'; // Default role
        if (userData.role === 'admin') {
            if (userData.admin_code === process.env.ADMIN_SECRET) {
                userRole = 'admin';
            } else {
                return res.status(403).json({ error: "Invalid admin code" });
            }
        }

        const newUser = new User({
            _id: id,
            email: userData.email,
            full_name: userData.full_name,
            password: userData.password,
            role: userRole,
            created_at: new Date().toISOString()
        });

        const inserted = await newUser.save();

        await logAudit({
            userId: inserted._id,
            userEmail: inserted.email,
            action: 'USER_REGISTER',
            resourceType: 'User',
            resourceId: inserted._id,
            details: { role: inserted.role }
        });

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
        await connectDB();
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: "Email required" });

        const user = await User.findOne({ email }).lean();
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
