const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const orderRoutes = require('./routes/orders');
const pricingRoutes = require('./routes/pricing');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pricing', pricingRoutes);

// Status check
app.get('/api/status', (req, res) => {
    res.json({ status: '3DINVENZA Server Operational', version: '2.0.0' });
});

app.listen(PORT, () => {
    console.log(`[SERVER] 3DINVENZA production node running on port ${PORT}`);
});
