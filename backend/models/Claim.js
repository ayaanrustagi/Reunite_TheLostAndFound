const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    item_id: String,
    claimer_name: String,
    claimer_email: String,
    claimer_phone: String,
    description: String,
    proof_image: String,
    status: { type: String, default: 'pending' },
    created_at: { type: String, default: () => new Date().toISOString() },
    created_by: String
}, {
    _id: false,
    strict: false,
    timestamps: false
});

module.exports = mongoose.models.Claim || mongoose.model('Claim', claimSchema);
 