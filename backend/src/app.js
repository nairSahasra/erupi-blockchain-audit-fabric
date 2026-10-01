'use strict';

const express = require('express');
const cors = require('cors');

const paymentRoutes = require('./routes/paymentRoutes');
const auditRoutes = require('./routes/auditRoutes');
const errorHandler = require('./middlewares/errorHandler');
const { checkConnectivity } = require('./fabric/client');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
    const fabric = await checkConnectivity();

    res.json({
        success: true,
        status: 'ok',
        fabric
    });
});

app.use('/api/payments', paymentRoutes);
app.use('/api/audit', auditRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

app.use(errorHandler);

module.exports = app;
