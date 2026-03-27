const Customer = require('./Customer');
const Good = require('./Good');
const Receipt = require('./Receipt');
const ReceiptItem = require('./ReceiptItem');
const StockMovement = require('./StockMovement');

// Associations
Customer.hasMany(Receipt, { foreignKey: 'customerId' });
Receipt.belongsTo(Customer, { foreignKey: 'customerId' });

Receipt.hasMany(ReceiptItem, { foreignKey: 'orderId' });
ReceiptItem.belongsTo(Receipt, { foreignKey: 'orderId' });

ReceiptItem.belongsTo(Good, { foreignKey: 'productId' });
Good.hasMany(ReceiptItem, { foreignKey: 'productId' });

Good.hasMany(StockMovement, { foreignKey: 'productId' });
StockMovement.belongsTo(Good, { foreignKey: 'productId' });

module.exports = {
  Customer,
  Good,
  Receipt,
  ReceiptItem,
  StockMovement
};
