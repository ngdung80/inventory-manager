const ReceiptService = require('../services/ReceiptService');

class ReceiptController {
  async getAllReceipts(req, res) {
    try {
      const receipts = await ReceiptService.getAllReceipts();
      res.json(receipts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReceiptById(req, res) {
    try {
      const receipt = await ReceiptService.getReceiptById(req.params.id);
      if (!receipt) return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
      res.json(receipt);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateReceipt(req, res) {
    try {
      const { customerId, totalAmount, tax, discount, items } = req.body;
      const receiptData = {
        customerId,
        totalAmount,
        tax,
        discount,
        status: 'COMPLETED',
        userId: req.user ? req.user.id : null // Assuming auth middleware sets req.user
      };
      const receipt = await ReceiptService.generateReceipt(receiptData, items);
      res.status(201).json(receipt);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async cancelReceipt(req, res) {
    try {
      const receipt = await ReceiptService.cancelReceipt(req.params.id);
      res.json({ message: 'Hủy hóa đơn thành công', receipt });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async replaceItem(req, res) {
    try {
      const { oldProductId, newProductId, newQuantity } = req.body;
      const result = await ReceiptService.replaceItem(req.params.id, oldProductId, newProductId, newQuantity);
      res.json({ message: 'Đổi trả sản phẩm thành công', result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ReceiptController();
