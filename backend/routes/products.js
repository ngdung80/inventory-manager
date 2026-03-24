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

// Get all products (View & Search)
router.get('/', verifyToken, (req, res) => {
    const { search } = req.query;
    let query = 'SELECT * FROM products';
    let params = [];
    if (search) {
        query += ' WHERE name LIKE ?';
        params.push(`%${search}%`);
    }
    query += ' ORDER BY id DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add product
router.post('/', verifyToken, (req, res) => {
    const { name, description, price, stock } = req.body;
    db.run(
        'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',
        [name, description, price, stock],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, name, description, price, stock });
        }
    );
});

// Update product (Price or Replace/Full update)
router.put('/:id', verifyToken, (req, res) => {
    const { name, description, price, stock } = req.body;
    db.run(
        'UPDATE products SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?',
        [name, description, price, stock, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product updated' });
        }
    );
});

// Delete product
router.delete('/:id', verifyToken, (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product deleted' });
    });
});

module.exports = router;
