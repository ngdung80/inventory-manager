const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');

// Helper to log stock movement
const logMovement = (productId, userId, type, quantity, reason) => {
    db.run('INSERT INTO stock_movements (productId, userId, type, quantity, reason) VALUES (?, ?, ?, ?, ?)',
        [productId, userId, type, quantity, reason], (err) => {
            if (err) console.error('Audit Log Error:', err.message);
            else console.log(`Audit Log Saved: ${type} for product ${productId}`);
        });
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
            const prodId = this.lastID;
            logMovement(prodId, req.user.id, 'ADD', stock, 'Initial stock');
            res.json({ id: prodId, name, description, price, stock });
        }
    );
});

// Update product (Price or Replace/Full update)
router.put('/:id', verifyToken, (req, res) => {
    const { name, description, price, stock } = req.body;
    
    // Get old stock for movement logging if stock changed
    db.get('SELECT stock FROM products WHERE id = ?', [req.params.id], (err, oldProd) => {
        db.run(
            'UPDATE products SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?',
            [name, description, price, stock, req.params.id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                
                if (oldProd && oldProd.stock !== stock) {
                    const diff = stock - oldProd.stock;
                    logMovement(req.params.id, req.user.id, 'EDIT', diff, 'Manual stock update');
                } else {
                    logMovement(req.params.id, req.user.id, 'EDIT', 0, 'Info update');
                }
                
                res.json({ message: 'Product updated' });
            }
        );
    });
});

// Manual Stock Removal (Audit Requirement)
router.post('/remove-goods', verifyToken, (req, res) => {
    const { productId, quantity, reason } = req.body;
    
    if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId], function(err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Lỗi cập nhật kho' });
            }
            
            db.run('INSERT INTO stock_movements (productId, userId, type, quantity, reason) VALUES (?, ?, ?, ?, ?)',
                [productId, req.user.id, 'REMOVAL', -quantity, reason || 'Phế phẩm/Hao hụt'],
                function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Lỗi ghi nhật ký kiểm toán' });
                    }
                    db.run('COMMIT');
                    res.json({ message: 'Đã trừ kho và ghi nhật ký thành công' });
                }
            );
        });
    });
});

// Delete product
router.delete('/:id', verifyToken, (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        logMovement(req.params.id, req.user.id, 'REMOVE', 0, 'Product deleted');
        res.json({ message: 'Product deleted' });
    });
});

module.exports = router;
