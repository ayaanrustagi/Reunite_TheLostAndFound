/**
 * @file authController.js
 * @description Controller handling authentication operations including login, user registration, and profile retrieval.
 * Employs salt rounds of 12 for bcrypt, and supports plain-text password migration.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

const bcrypt = require('bcryptjs');
const connectDB = require('../db');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

const SALT_ROUNDS = 12;

/**
 * Log in a user. Uses constant-time bcrypt checks to mitigate user-enumeration attacks.
 * Automatically hashes and upgrades plaintext passwords on successful authentication.
 * 
 * @param {Object} req - Express request object containing email and password
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.login = async (req, res) => {
    try {
        await connectDB();
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email }).lean();
        if (!user) {
            // Constant-time response — don't reveal whether the email exists.
            await bcrypt.compare(password, '$2a$12$invalidhashpadding000000000000000000000000000000000000');
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Support both hashed passwords (new) and legacy plaintext (migration path).
        const isHashed = user.password && user.password.startsWith('$2');
        const match = isHashed
            ? await bcrypt.compare(password, user.password)
            : user.password === password;

        if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

        // Opportunistically upgrade plaintext passwords on successful login.
        if (!isHashed) {
            const hashed = await bcrypt.hash(password, SALT_ROUNDS);
            await User.findByIdAndUpdate(user._id, { password: hashed });
        }

        // Log the successful login event for security audits
        await logAudit({
            userId: user._id,
            userEmail: user.email,
            action: 'USER_LOGIN',
            resourceType: 'User',
            resourceId: user._id,
            details: { role: user.role },
        });

        res.json({ id: user._id, email: user.email, full_name: user.full_name, role: user.role });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

/**
 * Register a new user. Handles user roles and validates processes.
 * Ensures role 'admin' can only be set if the client provides the correct secret key.
 * 
 * @param {Object} req - Express request object containing user payload and credentials
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.register = async (req, res) => {
    try {
        await connectDB();
        const userData = req.body;
        const id = userData.id || userData._id;

        if (!id) return res.status(400).json({ error: 'ID required.' });
        if (!userData.email || !userData.password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const existing = await User.findOne({ email: userData.email }).lean();
        if (existing) return res.status(400).json({ error: 'User already exists.' });

        // Secure role assignment — admin role requires the server-side secret.
        let userRole = 'student';
        if (userData.role === 'admin') {
            if (userData.admin_code === process.env.ADMIN_SECRET) {
                userRole = 'admin';
            } else {
                return res.status(403).json({ error: 'Invalid admin code.' });
            }
        }

        const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

        const newUser = new User({
            _id: id,
            email: userData.email,
            full_name: userData.full_name,
            password: hashedPassword,
            role: userRole,
            created_at: new Date().toISOString(),
        });

        const inserted = await newUser.save();

        // Log registration to system audit
        await logAudit({
            userId: inserted._id,
            userEmail: inserted.email,
            action: 'USER_REGISTER',
            resourceType: 'User',
            resourceId: inserted._id,
            details: { role: inserted.role },
        });

        res.status(201).json({
            id: inserted._id,
            email: inserted.email,
            full_name: inserted.full_name,
            role: inserted.role,
        });
    } catch (err) {
        res.status(400).json({ error: 'Registration failed.' });
    }
};

/**
 * Retrieve a user profile securely. Hides hashed credential data.
 * 
 * @param {Object} req - Express request containing query param 'email'
 * @param {Object} res - Express response
 * @returns {Promise<void>}
 */
exports.getProfile = async (req, res) => {
    try {
        await connectDB();
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email required.' });

        const user = await User.findOne({ email }).lean();
        if (!user) return res.status(404).json({ error: 'User not found.' });

        // Never return the password hash to the client.
        res.json({ id: user._id, email: user.email, full_name: user.full_name, role: user.role });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};
