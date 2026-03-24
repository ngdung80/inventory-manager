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
