const express = require('express');
const db = require('../db/database');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ObserverService = require('../services/ObserverService');
const ValidationService = require('../services/ValidationService');

// Helper to log stock movement
const logMovement = (productId, userId, type, quantity, reason, supplierId = null) => {
    db.run('INSERT INTO stock_movements (productId, userId, type, quantity, reason, supplierId) VALUES (?, ?, ?, ?, ?, ?)',
        [productId, userId, type, quantity, reason, supplierId], (err) => {
            if (err) console.error('StockMovement Log Error:', err.message);
        });
};

// POST /api/inventory/receive (Restocking from supplier)
router.post('/receive', verifyToken, (req, res) => {
    const { supplierId, productId, quantity, cost, reason } = req.body;
    try {
        ValidationService.validateStockReceive({ supplierId, productId, quantity });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('UPDATE products SET stock = stock + ?, supplierId = ? WHERE id = ?', [quantity, supplierId, productId], function (err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Error updating inventory' });
            }
            logMovement(productId, req.user.id, 'INBOUND', quantity, reason || 'Stock received from supplier', supplierId);
            ObserverService.emitStockEvent('stock_inbound', { productId, supplierId, quantity });
            db.run('COMMIT');
            res.json({ message: 'Goods received and inventory updated', productId, supplierId, quantity });
        });
    });
});

module.exports = router;
