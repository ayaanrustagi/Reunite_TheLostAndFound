const mongoose = require('mongoose');

// Reuse one connection across invocations. On serverless (Vercel) the module
// can be re-imported on every request, so we stash the connection on `global`
// to avoid opening a new pool each time and exhausting MongoDB's connections.
let cached = global.mongoose || (global.mongoose = { conn: null, promise: null });

async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10,
            minPoolSize: 2,
            family: 4,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 45000
        };
        console.log('Connecting to MongoDB...');

        cached.promise = mongoose.connect(process.env.MONGO_URI, opts)
            .catch(async (err) => {
                // No reachable MongoDB (e.g. judging on a laptop with no URI):
                // spin up an ephemeral in-memory database so the app still runs.
                // Data lives only for this process — fine for a demo, not for prod.
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
   