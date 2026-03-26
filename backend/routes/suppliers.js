const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, (req, res) => {
    db.all('SELECT * FROM suppliers ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/', verifyToken, (req, res) => {
    const { name, contact } = req.body;
    console.log(`[SUPPLIER] POST / creating: ${name}`);
    db.run(
        'INSERT INTO suppliers (name, contact) VALUES (?, ?)',
        [name, contact],
        function (err) {
            if (err) {
                console.error('[SUPPLIER] INSERT error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log(`[SUPPLIER] Created with ID: ${this.lastID}`);
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
