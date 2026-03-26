const { Receipt, ReceiptItem, Good, StockMovement } = require('../models');
const { sequelize } = require('../db/sequelize');

class GenerateReceiptCommand {
  constructor(receiptData, items) {
    this.receiptData = receiptData;
    this.items = items;
    this.receipt = null;
    this.receiptItems = [];
    this.stockMovements = [];
  }

  async execute() {
    const transaction = await sequelize.transaction();
    try {
      // 1. Create Receipt
      this.receipt = await Receipt.create(this.receiptData, { transaction });

      for (const item of this.items) {
        // 2. Validate Stock
        const product = await Good.findByPk(item.productId, { transaction });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Số lượng tồn kho không đủ cho sản phẩm ID ${item.productId}`);
        }

        // 3. Create Receipt Item
        const receiptItem = await ReceiptItem.create({
          orderId: this.receipt.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }, { transaction });
        this.receiptItems.push(receiptItem);

        // 4. Deduct Stock
        product.stock -= item.quantity;
        await product.save({ transaction });

        // 5. Log StockMovement (OUT)
        const movement = await StockMovement.create({
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          reason: `Bán hàng - Hóa đơn #${this.receipt.id}`,
          userId: this.receiptData.userId || null
        }, { transaction });
        this.stockMovements.push(movement);
      }

      await transaction.commit();
      return this.receipt;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async undo() {
    if (!this.receipt) return;

    const transaction = await sequelize.transaction();
    try {
      // 1. Mark Receipt as CANCELLED
      this.receipt.status = 'CANCELLED';
      await this.receipt.save({ transaction });

      // 2. Restore Stock
      const items = await ReceiptItem.findAll({ where: { orderId: this.receipt.id }, transaction });
      for (const item of items) {
        const product = await Good.findByPk(item.productId, { transaction });
        if (product) {
          product.stock += item.quantity;
          await product.save({ transaction });

          // 3. Log StockMovement (IN)
          await StockMovement.create({
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            reason: `Bồi hoàn Bán hàng - Hóa đơn #${this.receipt.id}`,
            userId: this.receipt.userId || null
          }, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = { GenerateReceiptCommand };
