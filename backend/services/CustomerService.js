const { Customer } = require('../models');
const { Op } = require('sequelize');

class CustomerService {
  async getAllCustomers(search) {
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }
    return await Customer.findAll({ where, order: [['id', 'DESC']] });
  }

  async getCustomerById(id) {
    return await Customer.findByPk(id);
  }

  async createCustomer(data) {
    const { name, phone, address, requests } = data;
    if (!name) throw new Error('Tên khách hàng không được để trống');
    return await Customer.create({ name, phone, address, requests });
  }

  async updateCustomer(id, data) {
    const customer = await Customer.findByPk(id);
    if (!customer) throw new Error('Không tìm thấy khách hàng');
    const { name, phone, address, requests } = data;
    if (!name) throw new Error('Tên khách hàng không được để trống');
    await customer.update({ name, phone, address, requests });
    return customer;
  }

  async deleteCustomer(id) {
    const customer = await Customer.findByPk(id);
    if (!customer) throw new Error('Không tìm thấy khách hàng');
    await customer.destroy();
  }
}

module.exports = new CustomerService();
