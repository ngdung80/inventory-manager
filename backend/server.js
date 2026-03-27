const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db/database'); // Initialize DB

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const supplierRoutes = require('./routes/suppliers');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);

// Basic test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Background job for Future Price Updates (Runs every minute)
    setInterval(() => {
        const today = new Date().toISOString().split('T')[0];
        db.all("SELECT * FROM price_updates WHERE status = 'PENDING' AND effectiveDate <= ?", [today], (err, rows) => {
            if (err) return console.error('Error fetching pending prices:', err);
            rows.forEach(update => {
                db.run("UPDATE products SET price = ? WHERE productId = ?", [update.newPrice, update.productId], (err) => {
                    if (!err) {
                        db.run("UPDATE price_updates SET status = 'APPLIED' WHERE id = ?", [update.id]);
                        console.log(`Applied scheduled price update for product ${update.productId}: ${update.newPrice}`);
                    }
                });
            });
        });
    }, 60000); // Check every 60 seconds
});
