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
    const { search, category } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    let params = [];
    
    if (search) {
        query += ' AND (name LIKE ? OR productId LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY id DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'System cannot retrieve data: ' + err.message });
        res.json(rows);
    });
});

// Add product
router.post('/', verifyToken, (req, res) => {
    const { productId, name, category, description, price, stock, expiryDate, supplierId } = req.body;
    
    if (!productId || !name || !category || price === undefined || price === '' || stock === undefined || stock === '') {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ các trường bắt buộc' });
    }

    if (Number(price) <= 0 || Number(stock) <= 0) {
        return res.status(400).json({ error: 'Giá và số lượng phải lớn hơn 0' });
    }

    db.get('SELECT id FROM products WHERE productId = ?', [productId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            return res.status(400).json({ error: 'Mã sản phẩm đã tồn tại. Vui lòng nhập mã khác.' });
        }

        db.run(
            'INSERT INTO products (productId, name, category, description, price, stock, expiryDate, supplierId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [productId, name, category, description, price, stock, expiryDate, supplierId],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, productId, name, category, description, price, stock, expiryDate, supplierId, success: true });
            }
        );
    });
});

// Update product (Price or Replace/Full update)
router.put('/:id', verifyToken, (req, res) => {
    const { productId, name, category, description, price, stock, expiryDate, supplierId } = req.body;

    if (!productId || !name || !category || price === undefined || price === '' || stock === undefined || stock === '') {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ các trường bắt buộc' });
    }

    if (Number(price) <= 0 || Number(stock) <= 0) {
        return res.status(400).json({ error: 'Giá và số lượng phải lớn hơn 0' });
    }

    db.get('SELECT id FROM products WHERE productId = ? AND id != ?', [productId, req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            return res.status(400).json({ error: 'Mã sản phẩm đã tồn tại. Vui lòng nhập mã khác.' });
        }

        db.run(
            'UPDATE products SET productId = ?, name = ?, category = ?, description = ?, price = ?, stock = ?, expiryDate = ?, supplierId = ? WHERE id = ?',
            [productId, name, category, description, price, stock, expiryDate, supplierId, req.params.id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Product updated', success: true });
            }
        );
    });
});

// Delete product
router.delete('/:id', verifyToken, (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product deleted' });
    });
});

// Get product by string productId
router.get('/by-product-id/:productId', verifyToken, (req, res) => {
    db.get('SELECT * FROM products WHERE productId = ?', [req.params.productId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Sản phẩm không tồn tại.' });
        res.json(row);
    });
});

// Update price use case
router.post('/update-price', verifyToken, (req, res) => {
    const { productId, newPrice, effectiveDate } = req.body;
    
    // Exception E2: Invalid price value
    if (!newPrice || Number(newPrice) <= 0) {
        return res.status(400).json({ error: 'Giá bán phải lớn hơn 0' });
    }

    db.get('SELECT * FROM products WHERE productId = ?', [productId], (err, product) => {
        if (err) return res.status(500).json({ error: 'Lỗi máy chủ' });
        
        // Exception E1: Product ID not found
        if (!product) {
            return res.status(400).json({ error: 'Sản phẩm không tồn tại. Vui lòng nhập mã chuẩn xác.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const isFuture = effectiveDate && effectiveDate > today;
        const status = isFuture ? 'PENDING' : 'APPLIED';

        db.run(
            'INSERT INTO price_updates (productId, oldPrice, newPrice, effectiveDate, status) VALUES (?, ?, ?, ?, ?)',
            [productId, product.price, newPrice, effectiveDate || today, status],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                
                if (!isFuture) {
                    // Apply immediately
                    db.run('UPDATE products SET price = ? WHERE productId = ?', [newPrice, productId], function(err) {
                        if (err) return res.status(500).json({ error: err.message });
                        return res.json({ message: 'Đã cập nhật giá hiện tại thành công', success: true });
                    });
                } else {
                    // Alternative Flow A1 - Future Price Update
                    return res.json({ message: 'Đã lên lịch cập nhật giá cho tương lai', success: true });
                }
            }
        );
    });
});

module.exports = router;
