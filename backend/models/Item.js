const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    item_name: String,
    description: String,
    category: String,
    location: String,
    date_found: String,
    contact_info: String,
    image: String,
    dhash: String,
    color: {
        r: Number,
        g: Number,
        b: Number
    },
    status: { type: String, default: 'pending' },
    created_at: { type: String, default: () => new Date().toISOString() },
    created_by: String,
    type: String,
    finder_name: String,
    finder_email: String,
    finder_phone: String
}, {
    _id: false,
    strict: false,
    timestamps: false
});

module.exports = mongoose.models.Item || mongoose.model('Item', itemSchema);
   