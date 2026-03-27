const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const router = express.Router();

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token' });
    try {
        req.user = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'super_secret_jwt_key_12345');
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

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
