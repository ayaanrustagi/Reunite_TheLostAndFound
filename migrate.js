/**
 * Migration script: NeDB -> MongoDB
 * Reads existing .db files and inserts them into MongoDB Atlas
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Item = require('./backend/models/Item');
const Claim = require('./backend/models/Claim');
const User = require('./backend/models/User');

function parseNeDB(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    const docs = [];
    for (const line of lines) {
        try {
            const doc = JSON.parse(line);
            // Skip NeDB internal deletion markers
            if (doc.$$deleted) continue;
            docs.push(doc);
        } catch (e) {
            // Skip malformed lines
        }
    }
    return docs;
}

async function migrate() {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!\n');

    const dataDir = path.join(__dirname, 'backend', 'data');

    // Migrate items
    const items = parseNeDB(path.join(dataDir, 'items.db'));
    if (items.length > 0) {
        console.log(`Migrating ${items.length} items...`);
        for (const item of items) {
            try {
                await Item.findOneAndUpdate(
                    { _id: item._id },
                    item,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                console.log(`  Item: ${item.item_name || item._id}`);
            } catch (err) {
                console.log(`  Skipped item ${item._id}: ${err.message}`);
            }
        }
    } else {
        console.log('No items to migrate.');
    }

    // Migrate claims
    const claims = parseNeDB(path.join(dataDir, 'claims.db'));
    if (claims.length > 0) {
        console.log(`\nMigrating ${claims.length} claims...`);
        for (const claim of claims) {
            try {
                await Claim.findOneAndUpdate(
                    { _id: claim._id },
                    claim,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                console.log(`  Claim: ${claim._id}`);
            } catch (err) {
                console.log(`  Skipped claim ${claim._id}: ${err.message}`);
            }
        }
    } else {
        console.log('\nNo claims to migrate.');
    }

    // Migrate users
    const users = parseNeDB(path.join(dataDir, 'users.db'));
    if (users.length > 0) {
        console.log(`\nMigrating ${users.length} users...`);
        for (const user of users) {
            try {
                await User.findOneAndUpdate(
                    { _id: user._id },
                    user,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                console.log(`  User: ${user.email}`);
            } catch (err) {
                console.log(`  Skipped user ${user._id}: ${err.message}`);
            }
        }
    } else {
        console.log('\nNo users to migrate.');
    }

    console.log('\nMigration complete!');
    await mongoose.disconnect();
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
 