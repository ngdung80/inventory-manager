import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Users, MessageSquare } from 'lucide-react';

const Customers = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', phone: '', address: '', requests: '' });

  useEffect(() => {
    if (!token) return navigate('/login');
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/customers', { headers: { Authorization: `Bearer ${token}` } });
      setCustomers(res.data);
    } catch (err) {}
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`http://localhost:5000/api/customers/${formData.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('http://localhost:5000/api/customers', formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) { alert('Lỗi lưu khách hàng'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa khách hàng này?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCustomers();
    } catch (err) {}
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--bg-color)' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <button className="btn" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', backgroundColor: 'white' }}>
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users color="var(--primary)" /> Quản lý Khách hàng
          </h1>
          <button className="btn btn-primary" onClick={() => { setFormData({ id: null, name: '', phone: '', address: '', requests: '' }); setShowModal(true); }} style={{ display: 'flex', gap: '0.5rem' }}>
            <Plus size={16} /> Thêm Khách hàng
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>Tên khách hàng</th>
                <th style={{ padding: '1rem' }}>Điện thoại</th>
                <th style={{ padding: '1rem' }}>Ghi nhận yêu cầu</th>
                <th style={{ padding: '1rem' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>#{c.id}</td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{c.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.phone}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {c.requests ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={14}/> {c.requests}</div> : '-'}
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => { setFormData(c); setShowModal(true); }} style={{ padding: '0.5rem', backgroundColor: '#EEF2FF', color: 'var(--primary)' }}>Sửa</button>
                    <button className="btn" onClick={() => handleDelete(c.id)} style={{ padding: '0.5rem', backgroundColor: '#FEE2E2', color: 'var(--danger)' }}>Xóa</button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Chưa có khách hàng</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', backgroundColor: 'white' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>{formData.id ? 'Sửa' : 'Thêm'} Khách hàng</h2>
            <form onSubmit={handleSaveCustomer}>
              <div className="input-group">
                <label>Tên khách hàng</label>
                <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Số điện thoại</label>
                <input type="text" className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Địa chỉ</label>
                <input type="text" className="input-field" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Ghi nhận yêu cầu (Log request)</label>
                <textarea className="input-field" value={formData.requests || ''} onChange={e => setFormData({...formData, requests: e.target.value})} minLength={3} style={{ height: '80px', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#F3F4F6' }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
