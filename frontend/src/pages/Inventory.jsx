import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Search, Edit2, Trash2, Package } from 'lucide-react';

const Inventory = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', description: '', price: '', stock: '', reorderLevel: 0 });
  const [removeData, setRemoveData] = useState({ productId: null, productName: '', quantity: '', reason: '' });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/products?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`http://localhost:5000/api/products/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:5000/api/products', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      setFormData({ id: null, name: '', description: '', price: '', stock: '', reorderLevel: 0 });
      fetchProducts();
    } catch (err) {
      alert('Lỗi khi lưu sản phẩm');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      alert('Lỗi khi xóa sản phẩm');
    }
  };

  const openEdit = (product) => {
    setFormData({ ...product, reorderLevel: product.reorderLevel || 0 });
    setShowModal(true);
  };

  const openAdd = () => {
    setFormData({ id: null, name: '', description: '', price: '', stock: '', reorderLevel: 0 });
    setShowModal(true);
  };

  const openRemove = (product) => {
    setRemoveData({ productId: product.id, productName: product.name, quantity: '', reason: '' });
    setShowRemoveModal(true);
  };

  const handleRemoveSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/products/remove-goods', removeData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowRemoveModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi trừ kho');
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--bg-color)' }}>
      <div className="container" style={{ maxWidth: '1100px' }}>
        <button className="btn" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', backgroundColor: 'white' }}>
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package color="var(--primary)" /> Quản lý Kho hàng
          </h1>
          <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Thêm hàng hóa
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', marginBottom: '1.5rem', position: 'relative' }}>
            <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '0.8rem' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Tìm kiếm hàng hóa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '3rem' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem' }}>Mã Sp</th>
                  <th style={{ padding: '1rem' }}>Tên mặt hàng</th>
                  <th style={{ padding: '1rem' }}>Giá (VND)</th>
                  <th style={{ padding: '1rem' }}>Tồn kho</th>
                  <th style={{ padding: '1rem' }}>Mức tái đặt hàng</th>
                  <th style={{ padding: '1rem' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy hàng hóa.</td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: p.stock <= p.reorderLevel ? '#FFFBF0' : 'transparent' }}>
                      <td style={{ padding: '1rem' }}>#{p.id}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '500' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.description}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>{p.price.toLocaleString()} đ</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '1rem', 
                          fontSize: '0.875rem', 
                          backgroundColor: p.stock > p.reorderLevel ? '#D1FAE5' : '#FEE2E2', 
                          color: p.stock > p.reorderLevel ? 'var(--success)' : 'var(--danger)',
                          fontWeight: 'bold'
                        }}>
                          {p.stock}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {p.reorderLevel} {p.stock <= p.reorderLevel && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginLeft: '0.5rem', fontWeight: 'bold' }}>(Cần nhập thêm!)</span>}
                      </td>
                      <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button className="btn" onClick={() => openEdit(p)} title="Chỉnh sửa" style={{ padding: '0.5rem', backgroundColor: '#EEF2FF', color: 'var(--primary)' }}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn" onClick={() => openRemove(p)} title="Trừ kho (Hao hụt/Hỏng)" style={{ padding: '0.5rem', backgroundColor: '#FFF7ED', color: '#EA580C' }}>
                          <Package size={16} />
                        </button>
                        <button className="btn" onClick={() => handleDelete(p.id)} title="Xóa vĩnh viễn" style={{ padding: '0.5rem', backgroundColor: '#FEE2E2', color: 'var(--danger)' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', backgroundColor: 'white' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {formData.id ? 'Cập nhật hàng hóa' : 'Thêm hàng hóa mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Tên mặt hàng</label>
                <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Mô tả</label>
                <input type="text" className="input-field" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Giá (VNĐ)</label>
                  <input type="number" className="input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Tồn kho</label>
                  <input type="number" className="input-field" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                </div>
              </div>
              <div className="input-group">
                <label>Mức tái đặt hàng (Reorder Level)</label>
                <input type="number" className="input-field" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} required />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Hệ thống sẽ chặn đặt hàng sỉ nếu Tồn kho &gt; Mức này (BR-06).</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#F3F4F6' }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RemovalModal 
        show={showRemoveModal} 
        onClose={() => setShowRemoveModal(false)} 
        data={removeData} 
        setData={setRemoveData} 
        onSubmit={handleRemoveSubmit} 
      />
    </div>
  );
};

/* --- Slide in removal modal at the end --- */
const RemovalModal = ({ show, onClose, data, setData, onSubmit }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 51, padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem', backgroundColor: 'white' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#EA580C' }}>
          Trừ kho hàng (Hao hụt/Hỏng)
        </h2>
        <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>Sản phẩm: <strong>{data.productName}</strong></p>
        <form onSubmit={onSubmit}>
          <div className="input-group">
            <label>Số lượng giảm</label>
            <input type="number" className="input-field" value={data.quantity} onChange={e => setData({...data, quantity: e.target.value})} placeholder="Vd: 5" required />
          </div>
          <div className="input-group">
            <label>Lý do (Ghi chú audit)</label>
            <textarea className="input-field" value={data.reason} onChange={e => setData({...data, reason: e.target.value})} placeholder="Vd: Hàng hết hạn, vỡ khi vận chuyển..." required style={{ minHeight: '80px', paddingTop: '0.5rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ flex: 1, backgroundColor: '#F3F4F6' }}>Hủy</button>
            <button type="submit" className="btn" style={{ flex: 1, backgroundColor: '#EA580C', color: 'white' }}>Xác nhận trừ kho</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Inventory;
