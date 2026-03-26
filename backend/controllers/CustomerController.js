const CustomerService = require('../services/CustomerService');

class CustomerController {
  async getAllCustomers(req, res) {
    try {
      const { search } = req.query;
      const customers = await CustomerService.getAllCustomers(search);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCustomerById(req, res) {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      if (!customer) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createCustomer(req, res) {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateCustomer(req, res) {
    try {
      const customer = await CustomerService.updateCustomer(req.params.id, req.body);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCustomer(req, res) {
    try {
      await CustomerService.deleteCustomer(req.params.id);
      res.json({ message: 'Xóa khách hàng thành công' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new CustomerController();
