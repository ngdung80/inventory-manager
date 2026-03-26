const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');

// Add to wishlist (Customer Request)
router.post('/wishlist', verifyToken, (req, res) => {
    const { customerId, productId, quantity, notes } = req.body;
    // salespersonId must be bound to the login user (req.user.id) to prevent spoofing
    const salespersonId = req.user.id; 

    db.run(
        'INSERT INTO wishlist (customerId, productId, salespersonId, quantity, notes) VALUES (?, ?, ?, ?, ?)',
        [customerId, productId, salespersonId, quantity, notes],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Đã lưu yêu cầu khách hàng' });
        }
    );
});

router.get('/', verifyToken, (req, res) => {
    db.all('SELECT * FROM customers ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/', verifyToken, (req, res) => {
    const { name, phone, address, requests } = req.body;
    db.run(
        'INSERT INTO customers (name, phone, address, requests) VALUES (?, ?, ?, ?)',
        [name, phone, address, requests],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, name, phone, address, requests });
        }
    );
});

router.put('/:id', verifyToken, (req, res) => {
    const { name, phone, address, requests } = req.body;
    db.run(
        'UPDATE customers SET name = ?, phone = ?, address = ?, requests = ? WHERE id = ?',
        [name, phone, address, requests, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Customer updated' });
        }
    );
});

router.delete('/:id', verifyToken, (req, res) => {
    db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Customer deleted' });
    });
});

module.exports = router;
