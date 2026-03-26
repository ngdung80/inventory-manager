const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');

// Get Stock Movement History (Audit Trail)
router.get('/movements', verifyToken, (req, res) => {
    const query = `
        SELECT sm.*, p.name as productName, u.username 
        FROM stock_movements sm 
        LEFT JOIN products p ON sm.productId = p.id 
        LEFT JOIN users u ON sm.userId = u.id 
        ORDER BY sm.createdAt DESC 
        LIMIT 100
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Fetch Movements Error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log(`Backend: Returning ${rows.length} movement records`);
        res.json(rows);
    });
});

router.get('/summary', verifyToken, (req, res) => {
    const { startDate, endDate } = req.query;
    
    let dateFilter = "";
    let dateParams = [];
    if (startDate && endDate) {
        dateFilter = " AND date(createdAt) >= date(?) AND date(createdAt) <= date(?)";
        dateParams = [startDate, endDate];
    }

    const report = {
        totalProducts: 0,
        totalCustomers: 0,
        totalSales: 0,
        totalPurchases: 0,
        lowStockAlerts: []
    };

    db.serialize(() => {
        db.get('SELECT COUNT(*) as c FROM products', (err, row) => report.totalProducts = row?.c || 0);
        db.get('SELECT COUNT(*) as c FROM customers', (err, row) => report.totalCustomers = row?.c || 0);
        
        db.get(`SELECT SUM(totalAmount) as s FROM orders WHERE type='SALE' AND status='COMPLETED' ${dateFilter}`, dateParams, (err, row) => report.totalSales = row?.s || 0);
        db.get(`SELECT SUM(totalAmount) as s FROM orders WHERE type='PURCHASE' AND status='COMPLETED' ${dateFilter}`, dateParams, (err, row) => report.totalPurchases = row?.s || 0);
        
        db.all('SELECT * FROM products WHERE stock < 10', (err, rows) => {
            report.lowStockAlerts = rows || [];
            res.json(report);
        });
    });
});

module.exports = router;
