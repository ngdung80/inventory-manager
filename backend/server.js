const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db/database'); // Initialize legacy DB
const { connectDB } = require('./db/sequelize'); // Initialize Sequelize

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Legacy and New Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const supplierRoutes = require('./routes/suppliers');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const reportRoutes = require('./routes/reports');
const receiptRoutes = require('./routes/receipts');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/receipts', receiptRoutes);

// Basic test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

// Initialize DBs and Start Server
const startServer = async () => {
    await connectDB(); // Connect Sequelize
    
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`ERROR: Port ${PORT} is already in use.`);
        } else {
            console.error('Server error:', err);
        }
        process.exit(1);
    });
};

startServer();
