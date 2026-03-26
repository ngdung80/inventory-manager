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

router.get('/', verifyToken, (req, res) => {
    const { startDate, endDate, type, status } = req.query;
    let query = 'SELECT o.*, c.name as customerName, s.name as supplierName, s.contact as supplierContact FROM orders o LEFT JOIN customers c ON o.customerId = c.id LEFT JOIN suppliers s ON o.supplierId = s.id WHERE 1=1';
    let params = [];
    
    if (startDate && endDate) {
        query += " AND date(o.createdAt) >= date(?) AND date(o.createdAt) <= date(?)";
        params.push(startDate, endDate);
    }
    if (type) {
        query += " AND o.type = ?"; params.push(type);
    }
    if (status) {
        query += " AND o.status = ?"; params.push(status);
    }
    query += ' ORDER BY o.createdAt DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET order details
router.get('/:id/items', verifyToken, (req, res) => {
    db.all('SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.productId = p.id WHERE oi.orderId = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create Order (Place Order or Sale)
router.post('/', verifyToken, (req, res) => {
    const { type, customerId, supplierId, totalAmount, status, items } = req.body;
    
    // BR-06: Check Reorder Level for PURCHASE orders
    if (type === 'PURCHASE' && items && items.length > 0) {
        const productIds = items.map(i => i.productId);
        const query = `SELECT id, name, stock, reorderLevel FROM products WHERE id IN (${productIds.join(',')})`;
        
        db.all(query, [], (err, products) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const violations = [];
            items.forEach(item => {
                const p = products.find(prod => prod.id === item.productId);
                if (p && p.stock > p.reorderLevel) {
                    violations.push(`${p.name} (Stock: ${p.stock}, Reorder Level: ${p.reorderLevel})`);
                }
            });
            
            if (violations.length > 0) {
                return res.status(400).json({ 
                    error: 'Business Rule BR-06 Violation: Stock level is already sufficient for some items.', 
                    details: violations 
                });
            }
            
            saveOrder();
        });
    } else {
        saveOrder();
    }

    function saveOrder() {
        db.run(
            'INSERT INTO orders (type, customerId, supplierId, totalAmount, status) VALUES (?, ?, ?, ?, ?)',
            [type, customerId || null, supplierId || null, totalAmount, status || 'COMPLETED'],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                const orderId = this.lastID;
                
                if (items && items.length > 0) {
                    let completed = 0;
                    items.forEach(item => {
                        db.run('INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)', 
                            [orderId, item.productId, item.quantity, item.price], 
                            function(err) {
                                if (err) console.error("Insert error", err);
                                
                                if (type === 'SALE') {
                                    db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.productId], (err) => {
                                        if (err) console.error("Update stock error", err);
                                        completed++;
                                        if (completed === items.length) res.json({ id: orderId, type, totalAmount, status });
                                    });
                                } else {
                                    completed++;
                                    if (completed === items.length) res.json({ id: orderId, type, totalAmount, status });
                                }
                            }
                        );
                    });
                } else {
                    res.json({ id: orderId, type, totalAmount, status });
                }
            }
        );
    }
});

// Generate Invoice (Complete Purchase Order & Increase Stock)
router.put('/:id/invoice', verifyToken, (req, res) => {
    db.all('SELECT * FROM order_items WHERE orderId = ?', [req.params.id], (err, items) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (items.length === 0) return updateStatusOnly();
        
        let completed = 0;
        items.forEach(item => {
            db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.productId], () => {
                completed++;
                if (completed === items.length) updateStatusOnly();
            });
        });
    });

    function updateStatusOnly() {
        db.run('UPDATE orders SET status = ? WHERE id = ?', ['COMPLETED', req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Invoice generated, stock updated' });
        });
    }
});

// Update Order status specifically
router.put('/:id/status', verifyToken, (req, res) => {
    const { status } = req.body; 
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Order status updated' });
    });
});

module.exports = router;
