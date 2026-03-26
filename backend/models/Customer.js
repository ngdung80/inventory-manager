const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/sequelize');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
  },
  requests: {
    type: DataTypes.TEXT,
  }
}, {
  tableName: 'customers',
  timestamps: false,
});

module.exports = Customer;
