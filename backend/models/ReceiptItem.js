const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/sequelize');

const ReceiptItem = sequelize.define('ReceiptItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  }
}, {
  tableName: 'order_items',
  timestamps: false,
});

module.exports = ReceiptItem;
