/**
 * @file User.js
 * @description Mongoose schema definition for the User model.
 * Stores user authentication details, personal details, roles, and profiles.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

const mongoose = require('mongoose');

/**
 * User Schema Definition
 * 
 * @property {String} _id - Unique identifier for the user (typically UUID or custom string)
 * @property {String} email - Unique, indexed email address for user login
 * @property {String} full_name - The user's full name
 * @property {String} password - Hashed password string (legacy plaintext migrated automatically on login)
 * @property {String} role - User role (e.g. 'student', 'admin', 'user') for role-based authorization
 * @property {String} created_at - ISO 8601 string representation of when the user was registered
 */
const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    full_name: String,
    password: String,
    role: { type: String, default: 'user' },
    created_at: { type: String, default: () => new Date().toISOString() }
}, {
    _id: false,
    strict: false,
    timestamps: false
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

   