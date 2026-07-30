const mongoose = require('mongoose');

// One document per physical lost-and-found box (identified by deviceId).
// history[] keeps a rolling log of readings so the dashboard can show a
// fill-level trend, not just the latest snapshot.
const boxStatusSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    fillPercent: { type: Number, required: true, min: 0, max: 100 },
    location: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
    lastAlertAt: { type: Date, default: null },
    history: [{
        fillPercent: Number,
        recordedAt: { type: Date, default: Date.now }
    }]
}, {
    strict: false,
    timestamps: false
});

module.exports = mongoose.models.BoxStatus || mongoose.model('BoxStatus', boxStatusSchema);
