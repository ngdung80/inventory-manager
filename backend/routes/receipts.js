const express = require('express');
const router = express.Router();
const ReceiptController = require('../controllers/ReceiptController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, ReceiptController.getAllReceipts);
router.get('/:id', verifyToken, ReceiptController.getReceiptById);
router.post('/', verifyToken, ReceiptController.generateReceipt);
router.post('/:id/cancel', verifyToken, ReceiptController.cancelReceipt);
router.post('/:id/replace', verifyToken, ReceiptController.replaceItem);

module.exports = router;
