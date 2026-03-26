const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/CustomerController');
const { verifyToken } = require('../middleware/auth');

// Add to wishlist (Keeping existing for compatibility, but could be refactored)
const db = require('../db/database');
router.post('/wishlist', verifyToken, (req, res) => {
    const { customerId, productId, quantity, notes } = req.body;
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

// Sequelize based CRUD
router.get('/', verifyToken, CustomerController.getAllCustomers);
router.get('/:id', verifyToken, CustomerController.getCustomerById);
router.post('/', verifyToken, CustomerController.createCustomer);
router.put('/:id', verifyToken, CustomerController.updateCustomer);
router.delete('/:id', verifyToken, CustomerController.deleteCustomer);

module.exports = router;
