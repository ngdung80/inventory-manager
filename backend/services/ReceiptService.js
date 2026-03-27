const { Receipt, ReceiptItem, Good, StockMovement } = require('../models');
const { sequelize } = require('../db/sequelize');
const { GenerateReceiptCommand } = require('../commands/ReceiptCommands');

class ReceiptService {
  async generateReceipt(receiptData, items) {
    const command = new GenerateReceiptCommand(receiptData, items);
    return await command.execute();
  }

  async cancelReceipt(receiptId) {
    const receipt = await Receipt.findByPk(receiptId);
    if (!receipt) throw new Error('Không tìm thấy hóa đơn');
    if (receipt.status === 'CANCELLED') throw new Error('Hóa đơn này đã được hủy trước đó');

    const command = new GenerateReceiptCommand(receipt, []); // items not needed for undo if using existing receipt
    command.receipt = receipt;
    await command.undo();
    return receipt;
  }

  async replaceItem(receiptId, oldProductId, newProductId, newQuantity) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Find Receipt and ReceiptItem
      const receipt = await Receipt.findByPk(receiptId, { transaction });
      const oldItem = await ReceiptItem.findOne({ 
        where: { orderId: receiptId, productId: oldProductId },
        transaction 
      });

      if (!receipt || !oldItem) throw new Error('Không tìm thấy hóa đơn hoặc sản phẩm');

      // 2. Return Old Item to Stock
      const oldProduct = await Good.findByPk(oldProductId, { transaction });
      if (oldProduct) {
        oldProduct.stock += oldItem.quantity;
        await oldProduct.save({ transaction });

        // Log IN Movement
        await StockMovement.create({
          productId: oldProductId,
          type: 'IN',
          quantity: oldItem.quantity,
          reason: `Đổi trả - Hóa đơn #${receiptId} (Sản phẩm cũ)`,
          userId: receipt.userId || null
        }, { transaction });
      }

      // 3. Deduct New Item from Stock
      const newProduct = await Good.findByPk(newProductId, { transaction });
      if (!newProduct || newProduct.stock < newQuantity) {
        throw new Error('Số lượng tồn kho không đủ cho sản phẩm mới');
      }
      newProduct.stock -= newQuantity;
      await newProduct.save({ transaction });

      // Log OUT Movement
      await StockMovement.create({
        productId: newProductId,
        type: 'OUT',
        quantity: newQuantity,
        reason: `Đổi trả - Hóa đơn #${receiptId} (Sản phẩm mới)`,
        userId: receipt.userId || null
      }, { transaction });

      // 4. Update ReceiptItem
      oldItem.productId = newProductId;
      oldItem.quantity = newQuantity;
      oldItem.price = newProduct.price;
      await oldItem.save({ transaction });

      // 5. Update Receipt Total (simplification: recalculate all items)
      const allItems = await ReceiptItem.findAll({ where: { orderId: receiptId }, transaction });
      const newTotal = allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      receipt.totalAmount = newTotal; // Should account for tax/discount if stored
      await receipt.save({ transaction });

      await transaction.commit();
      return { receipt, updatedItems: allItems };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllReceipts() {
    return await Receipt.findAll({
      include: [
        { model: ReceiptItem, include: [Good] },
        { model: Customer }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async getReceiptById(id) {
    return await Receipt.findByPk(id, {
      include: [
        { model: ReceiptItem, include: [Good] },
        { model: Customer }
      ]
    });
  }
}

module.exports = new ReceiptService();
