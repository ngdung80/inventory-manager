const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

let sequelize;

if (process.env.DB_DIALECT === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
    }
  );
} else {
  // Default to SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'store.db'),
    logging: false,
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Sequelize connected successfully.');
    // Sync models
    await sequelize.sync();
    console.log('Cơ sở dữ liệu đã được đồng bộ.');
  } catch (error) {
    console.error('Lỗi kết nối Sequelize:', error);
  }
};

module.exports = { sequelize, connectDB };
