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
    db.all('SELECT * FROM suppliers ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/', verifyToken, (req, res) => {
    const { name, contact } = req.body;
    db.run(
        'INSERT INTO suppliers (name, contact) VALUES (?, ?)',
        [name, contact],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, name, contact });
        }
    );
});

router.put('/:id', verifyToken, (req, res) => {
    const { name, contact } = req.body;
    db.run(
        'UPDATE suppliers SET name = ?, contact = ? WHERE id = ?',
        [name, contact, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Supplier updated' });
        }
    );
});

router.delete('/:id', verifyToken, (req, res) => {
    db.run('DELETE FROM suppliers WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Supplier deleted' });
    });
});

module.exports = router;
