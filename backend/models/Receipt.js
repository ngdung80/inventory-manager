const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/sequelize');

const Receipt = sequelize.define('Receipt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  tax: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  discount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'COMPLETED',
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'SALE',
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'orders',
  timestamps: false,
});

module.exports = Receipt;
