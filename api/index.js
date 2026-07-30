require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('../backend/db');
const itemRoutes = require('../backend/routes/items');
const claimRoutes = require('../backend/routes/claims');
const authRoutes = require('../backend/routes/auth');
const auditRoutes = require('../backend/routes/audit');
const matchRoutes = require('../backend/routes/match');
const messageRoutes = require('../backend/routes/messages');
const sensorRoutes = require('../backend/routes/sensors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to DB before handling routes
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Routes - mounted at root since Vercel rewrites /api/* to this handler
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/sensors', sensorRoutes);

// Export for Vercel
module.exports = app;
   