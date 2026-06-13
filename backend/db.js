const mongoose = require('mongoose');

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        console.log('Using cached MongoDB connection');
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Return connection errors immediately instead of hanging
            serverSelectionTimeoutMS: 5000, // Reduced from default 30s to fail fast
            socketTimeoutMS: 45000,
        };

        console.log('Connecting to MongoDB...');
        cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
            console.log('✅ New MongoDB connection established');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('🔴 MongoDB connection failed:', e);
        throw e;
    }

    return cached.conn;
}

module.exports = connectDB;
