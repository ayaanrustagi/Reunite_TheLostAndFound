const mongoose = require('mongoose');

let cached = global.mongoose || (global.mongoose = { conn: null, promise: null });

async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const opts = { bufferCommands: false, serverSelectionTimeoutMS: 5000 };
        console.log('Connecting to MongoDB...');

        cached.promise = mongoose.connect(process.env.MONGO_URI, opts)
            .catch(async (err) => {
                console.warn('Primary MongoDB connection failed. Starting In-Memory fallback...');
                try {
                    const { MongoMemoryServer } = require('mongodb-memory-server');
                    const mongo = await MongoMemoryServer.create();
                    const uri = mongo.getUri();
                    console.log('In-Memory MongoDB started:', uri);
                    return mongoose.connect(uri, opts);
                } catch (memErr) {
                    console.error('Failed to start In-Memory MongoDB:', memErr);
                    throw err;
                }
            })
            .then((m) => {
                console.log('MongoDB connection established');
                return m;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
}

module.exports = connectDB;
