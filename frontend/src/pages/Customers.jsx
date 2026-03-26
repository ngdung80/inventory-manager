import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Users, MessageSquare, Search, Edit2, Trash2, Mail, Phone, MapPin } from 'lucide-react';

const Customers = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', phone: '', email: '', address: '', requests: '' });

  useEffect(() => {
    if (!token) return navigate('/login');
    fetchCustomers();
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/customers?search=${searchTerm}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
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
    } catch (err) { 
      alert('Error saving customer: ' + (err.response?.data?.error || err.message)); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCustomers();
    } catch (err) {
      alert('Error deleting customer');
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: '#f8fafc' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button className="btn" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <ArrowLeft size={16} /> Quay lại Tổng quan
          </button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
              <input 
                type="text" 
                placeholder="Tìm tên hoặc số điện thoại..." 
                className="input-field" 
                style={{ paddingLeft: '2.5rem', width: '300px', border: '1px solid #e2e8f0', borderRadius: '0.5rem', height: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => { setFormData({ id: null, name: '', phone: '', email: '', address: '', requests: '' }); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '500' }}>
              <Plus size={16} /> Thêm Khách hàng
            </button>
          </div>
        </div>
        
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <Users color="#6366f1" size={32} /> Quản lý Khách hàng
        </h1>

        <div className="glass-panel" style={{ padding: '0', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: '600' }}>Khách hàng</th>
                <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: '600' }}>Thông tin Liên hệ</th>
                <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: '600' }}>Địa chỉ</th>
                <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: '600' }}>Yêu cầu đặc biệt</th>
                <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: '600' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mã KH: #{c.id}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontSize: '0.9rem' }}><Phone size={14} color="#94a3b8"/> {c.phone || 'N/A'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Mail size={14} color="#94a3b8"/> {c.email || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} color="#94a3b8"/> {c.address || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    {c.requests ? (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: '#6366f1', backgroundColor: '#eef2ff', padding: '0.5rem', borderRadius: '0.5rem' }}>
                        <MessageSquare size={14} style={{ marginTop: '2px' }}/> 
                        <span>{c.requests}</span>
                      </div>
                    ) : (
                      <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Không có ưu cầu</span>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => { setFormData(c); setShowModal(true); }} style={{ padding: '0.5rem', color: '#6366f1', background: '#eef2ff', border: 'none', borderRadius: '0.4rem', cursor: 'pointer' }}><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(c.id)} style={{ padding: '0.5rem', color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: '0.4rem', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                    <p>Không tìm thấy khách hàng nào phù hợp.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '500px', padding: '2rem', backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{formData.id ? 'Sửa' : 'Thêm mới'} Khách hàng</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>X</button>
            </div>
            <form onSubmit={handleSaveCustomer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group" style={{ marginBottom: '1rem', gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem' }}>Họ và Tên</label>
                  <input type="text" className="input-field" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Nguyễn Văn A" />
                </div>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem' }}>Số điện thoại</label>
                  <input type="text" className="input-field" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="0123 456 789" />
                </div>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem' }}>Địa chỉ Email</label>
                  <input type="email" className="input-field" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="example@email.com" />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem' }}>Địa chỉ</label>
                <input type="text" className="input-field" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Số nhà, Tên đường, Thành phố" />
              </div>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem' }}>Ghi chú / Yêu cầu đặc biệt</label>
                <textarea className="input-field" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', height: '100px', resize: 'none' }} value={formData.requests || ''} onChange={e => setFormData({...formData, requests: e.target.value})} placeholder="Các yêu cầu hoặc lưu ý về khách hàng..." />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '0.5rem', color: '#64748b', fontWeight: '600' }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600' }}>{formData.id ? 'Lưu Thay đổi' : 'Tạo Khách hàng'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
