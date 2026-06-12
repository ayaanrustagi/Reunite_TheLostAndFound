require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const itemRoutes = require('./backend/routes/items');
const claimRoutes = require('./backend/routes/claims');
const authRoutes = require('./backend/routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, '.')));

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/auth', authRoutes);

// Fallback for SPA
app.get('*path', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`🚀 REUNITE Server running locally!`);
    console.log(`🔗 Access it at: http://localhost:${PORT}`);
    console.log(`📁 Data is being saved to the /data folder`);
});
