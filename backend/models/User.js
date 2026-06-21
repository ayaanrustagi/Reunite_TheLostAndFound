const mongoose = require('mongoose');

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
   