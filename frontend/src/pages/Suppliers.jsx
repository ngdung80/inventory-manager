import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Truck } from 'lucide-react';

const Suppliers = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', contact: '' });

  useEffect(() => {
    if (!token) return navigate('/login');
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/suppliers', { headers: { Authorization: `Bearer ${token}` } });
      setSuppliers(res.data);
    } catch (err) {}
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`http://localhost:5000/api/suppliers/${formData.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('http://localhost:5000/api/suppliers', formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) { alert('Lỗi lưu nhà cung cấp'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa nhà cung cấp?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/suppliers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchSuppliers();
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
            <Truck color="var(--primary)" /> Quản lý Nhà cung cấp
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={() => { setFormData({ id: null, name: '', contact: '' }); setShowModal(true); }} style={{ display: 'flex', gap: '0.5rem' }}>
              <Plus size={16} /> Thêm Nhà cung cấp
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>Tên nhà cung cấp</th>
                <th style={{ padding: '1rem' }}>Thông tin liên hệ</th>
                <th style={{ padding: '1rem' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>#{s.id}</td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{s.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{s.contact}</td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => { setFormData(s); setShowModal(true); }} style={{ padding: '0.5rem', backgroundColor: '#EEF2FF', color: 'var(--primary)' }}>Sửa</button>
                    <button className="btn" onClick={() => handleDelete(s.id)} style={{ padding: '0.5rem', backgroundColor: '#FEE2E2', color: 'var(--danger)' }}>Xóa</button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Chưa có nhà cung cấp</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', backgroundColor: 'white' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>{formData.id ? 'Sửa' : 'Thêm'} Nhà cung cấp</h2>
            <form onSubmit={handleSaveSupplier}>
              <div className="input-group">
                <label>Tên nhà cung cấp</label>
                <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Thông tin liên hệ</label>
                <input type="text" className="input-field" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} required />
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

export default Suppliers;
