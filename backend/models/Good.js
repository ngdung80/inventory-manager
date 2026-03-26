const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/sequelize');

const Good = sequelize.define('Good', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  reorderLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
}, {
  tableName: 'products',
  timestamps: false,
});

module.exports = Good;
