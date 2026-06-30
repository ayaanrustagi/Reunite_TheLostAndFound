require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./backend/db');

const itemRoutes  = require('./backend/routes/items');
const claimRoutes = require('./backend/routes/claims');
const authRoutes  = require('./backend/routes/auth');
const matchRoutes = require('./backend/routes/match');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ──────────────────────────────────────────────────────────
// helmet sets X-Frame-Options, X-Content-Type-Options, HSTS, CSP, etc.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc:  ["'self'", "'unsafe-inline'",
                         'cdn.jsdelivr.net', 'cdnjs.cloudflare.com',
                         'unpkg.com', 'ajax.googleapis.com'],
            styleSrc:   ["'self'", "'unsafe-inline'",
                         'fonts.googleapis.com', 'cdnjs.cloudflare.com'],
            fontSrc:    ["'self'", 'fonts.gstatic.com', 'cdnjs.cloudflare.com'],
            imgSrc:     ["'self'", 'data:', 'blob:',
                         '*.tile.openstreetmap.org', 'unpkg.com'],
            connectSrc: ["'self'", 'api.emailjs.com', 'api.groq.com'],
        },
    },
    crossOriginEmbedderPolicy: false, // allow Leaflet tiles cross-origin
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Strict limit on auth endpoints to block brute-force attacks.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — please try again in 15 minutes.' },
});

// General API limit (generous but prevents scraping/DoS).
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Body parsing — cap at 10 MB (photos are resized client-side) ──────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '.')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',   authLimiter, authRoutes);
app.use('/api/items',  apiLimiter,  itemRoutes);
app.use('/api/claims', apiLimiter,  claimRoutes);
app.use('/api/match',  apiLimiter,  matchRoutes);

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*path', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`REUNITE running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1);
});
