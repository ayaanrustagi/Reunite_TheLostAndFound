/**
 * @file Item.js
 * @description Mongoose schema definition for the Item model.
 * Handles lost and found items including metadata, locations, dhash (for visual matching), and contact info.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

const mongoose = require('mongoose');

/**
 * Item Schema Definition
 * 
 * @property {String} _id - Unique identifier for the item (typically UUID or custom string)
 * @property {String} item_name - The name or title of the item
 * @property {String} description - Detailed text description of the item
 * @property {String} category - General category (e.g. 'Electronics', 'Keys', 'Wallets')
 * @property {String} location - Geographical or location description where found/lost
 * @property {String} date_found - Date representation of when the item was encountered
 * @property {String} contact_info - Secondary contact info/phone/email
 * @property {String} image - Base64 encoded or URL representation of the item's image
 * @property {String} dhash - Difference hash (64-bit binary/hex representation) for perceptual image hashing / similarity search
 * @property {Object} color - RGB color profile representing dominant item color
 * @property {Number} color.r - Red channel value (0-255)
 * @property {Number} color.g - Green channel value (0-255)
 * @property {Number} color.b - Blue channel value (0-255)
 * @property {String} status - Current item status ('pending', 'resolved', etc.)
 * @property {String} created_at - ISO 8601 creation timestamp string
 * @property {String} created_by - User ID of the reporter
 * @property {String} type - Type of report ('lost' or 'found')
 * @property {String} finder_name - Name of person who found the item
 * @property {String} finder_email - Email address of finder
 * @property {String} finder_phone - Phone number of finder
 */
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
    status: { type: String, default: 'pending', index: true },
    created_at: { type: String, default: () => new Date().toISOString(), index: -1 },
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

   