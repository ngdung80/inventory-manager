const express = require('express');
const db = require('../db/database');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ValidationService = require('../services/ValidationService');
const ObserverService = require('../services/ObserverService');
const { TaxStrategy, DiscountStrategy } = require('../services/StrategyService');

// POST /api/sales/receipt - Sale/Export Goods Workflow
router.post('/receipt', verifyToken, async (req, res) => {
    const { customerId, items } = req.body;
    try {
        ValidationService.validateSaleItems(items);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
    if (!customerId) {
        return res.status(400).json({ error: 'customerId is required' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        let total = 0;
        let errorFlag = false;

        // Check stock & update
        for (const item of items) {
            db.get('SELECT stock, price FROM products WHERE id = ?', [item.productId], (err, productRow) => {
                if (errorFlag) return;
                if (err || !productRow || productRow.stock < item.quantity) {
                    errorFlag = true;
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: `Insufficient stock or bad product for id ${item.productId}` });
                }
                total += item.quantity * (item.price || productRow.price);
            });
        }

        // After verifying stock, deduct and log
        items.forEach(item => {
            db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.productId], function (err) {
                if (err && !errorFlag) {
                    errorFlag = true;
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Stock update failed' });
                }

                db.run('INSERT INTO stock_movements (productId, userId, type, quantity, reason) VALUES (?, ?, ?, ?, ?)',
                    [item.productId, req.user.id, 'OUTBOUND', item.quantity, 'Bán hàng'],
                    function (err) {
                        if (err && !errorFlag) {
                            errorFlag = true;
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Stock movement log failed' });
                        }
                        ObserverService.emitStockEvent('stock_outbound', { productId: item.productId, userId: req.user.id, quantity: item.quantity });
                    });
            });
        });

        // Calculate Tax & Discount
        const taxValue = new TaxStrategy().calculate(total, items);
        const discountValue = new DiscountStrategy().calculate(total, items, { id: customerId });

        // Insert receipt/order
        db.run('INSERT INTO orders (type, customerId, totalAmount, status) VALUES (?, ?, ?, ?)',
            ['SALE', customerId, total, 'COMPLETED'], function (err) {
                if (err && !errorFlag) {
                    errorFlag = true;
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Create receipt failed' });
                }
                const receiptId = this.lastID;
                // Insert order_items
                items.forEach(item => {
                    db.run('INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)',
                        [receiptId, item.productId, item.quantity, item.price], (itemErr) => {
                            if (itemErr && !errorFlag) {
                                errorFlag = true;
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: 'Item insertion failed' });
                            }
                        });
                });
                db.run('COMMIT');
                ObserverService.emitStockEvent('sale_receipt', { receiptId, customerId, items, total, tax: taxValue, discount: discountValue });
                res.status(201).json({ receiptId, items, total, tax: taxValue, discount: discountValue });
            });
    });
});

module.exports = router;
