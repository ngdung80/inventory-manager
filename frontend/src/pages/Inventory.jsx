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
  const [formData, setFormData] = useState({ id: null, productId: '', name: '', category: '', description: '', price: '', stock: '', expiryDate: '', supplierId: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceFormData, setPriceFormData] = useState({ productId: '', name: '', currentPrice: '', newPrice: '', effectiveDate: '' });
  const [priceErrorMsg, setPriceErrorMsg] = useState('');
  const [priceSuccessMsg, setPriceSuccessMsg] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [search, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setErrorMsg('');
      const res = await axios.get(`http://localhost:5000/api/products?search=${search}&category=${categoryFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'System cannot retrieve data: Lỗi kết nối máy chủ');
      setProducts([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.productId || !formData.name || !formData.category || !formData.price || !formData.stock) {
        setErrorMsg('Vui lòng điền đầy đủ các trường bắt buộc (Mã SP, Tên, Danh mục, Giá, Số lượng).');
        return;
    }

    if (Number(formData.price) <= 0 || Number(formData.stock) <= 0) {
        setErrorMsg('Giá và số lượng phải lớn hơn 0.');
        return;
    }

    try {
      if (formData.id) {
        await axios.put(`http://localhost:5000/api/products/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg('Cập nhật hàng hóa thành công!');
      } else {
        await axios.post('http://localhost:5000/api/products', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg('Thêm mặt hàng thành công!');
      }
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg('');
        fetchProducts();
      }, 1500);
      setFormData({ id: null, productId: '', name: '', category: '', description: '', price: '', stock: '', expiryDate: '', supplierId: '' });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Lỗi khi lưu sản phẩm');
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
    setFormData(product);
    setShowModal(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const openAdd = () => {
    setFormData({ id: null, productId: '', name: '', category: '', description: '', price: '', stock: '', expiryDate: '', supplierId: '' });
    setShowModal(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleProductIdBlur = async () => {
    if (!priceFormData.productId) return;
    try {
      setPriceErrorMsg('');
      const encodedId = encodeURIComponent(priceFormData.productId.trim());
      const res = await axios.get(`http://localhost:5000/api/products/by-product-id/${encodedId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPriceFormData(prev => ({
        ...prev,
        productId: priceFormData.productId.trim(),
        name: res.data.name,
        currentPrice: res.data.price
      }));
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        setPriceErrorMsg('Sản phẩm không tồn tại. Vui lòng kiểm tra lại Mã SP.');
      } else {
        setPriceErrorMsg('Lỗi khi tra cứu sản phẩm.');
      }
      setPriceFormData(prev => ({
        ...prev,
        name: '',
        currentPrice: ''
      }));
    }
  };

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    setPriceErrorMsg('');
    setPriceSuccessMsg('');
    
    if (Number(priceFormData.newPrice) <= 0) {
      setPriceErrorMsg('Dữ liệu không hợp lệ: Giá bán phải lớn hơn 0.');
      return;
    }
    if (!priceFormData.name) {
      setPriceErrorMsg('Vui lòng nhập Mã SP hợp lệ trước khi lưu.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/products/update-price', {
        productId: priceFormData.productId,
        newPrice: priceFormData.newPrice,
        effectiveDate: priceFormData.effectiveDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPriceSuccessMsg(res.data.message);
      setTimeout(() => {
        setShowPriceModal(false);
        setPriceSuccessMsg('');
        fetchProducts();
      }, 1500);
    } catch (err) {
      setPriceErrorMsg(err.response?.data?.error || 'Lỗi khi cập nhật giá');
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--bg-color)' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <button className="btn" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', backgroundColor: 'white' }}>
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package color="var(--primary)" /> Quản lý Kho hàng
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" onClick={() => { setShowPriceModal(true); setPriceFormData({ productId: '', name: '', currentPrice: '', newPrice: '', effectiveDate: '' }); setPriceErrorMsg(''); setPriceSuccessMsg(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D' }}>
              💲 Cập nhật giá bán
            </button>
            <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Thêm hàng hóa
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          
          {errorMsg && !showModal && <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#FEE2E2', color: 'var(--danger)', borderRadius: '0.5rem', border: '1px solid #F87171' }}>{errorMsg}</div>}

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '0.8rem' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Tìm kiếm hàng hóa..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '3rem', margin: 0, height: '100%' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <select 
                className="input-field" 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ margin: 0, height: '100%' }}
              >
                <option value="">Tất cả danh mục</option>
                <option value="Thực phẩm">Thực phẩm</option>
                <option value="Đồ uống">Đồ uống</option>
                <option value="Gia dụng">Gia dụng</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <button className="btn" onClick={fetchProducts} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#EEF2FF', color: 'var(--primary)', padding: '0 1.5rem' }}>
              🔄 Làm mới
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem' }}>Mã Sp</th>
                  <th style={{ padding: '1rem' }}>Tên mặt hàng</th>
                  <th style={{ padding: '1rem' }}>Danh mục</th>
                  <th style={{ padding: '1rem' }}>Hạn SD</th>
                  <th style={{ padding: '1rem' }}>Giá (VND)</th>
                  <th style={{ padding: '1rem' }}>Tồn kho</th>
                  <th style={{ padding: '1rem' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy hàng hóa.</td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>{p.productId || `#${p.id}`}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{p.name}</td>
                      <td style={{ padding: '1rem' }}>{p.category}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.expiryDate || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{p.price.toLocaleString()} đ</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', backgroundColor: p.stock > 10 ? '#D1FAE5' : '#FEF3C7', color: p.stock > 10 ? 'var(--success)' : '#D97706' }}>
                          {p.stock}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button className="btn" onClick={() => openEdit(p)} style={{ padding: '0.5rem', backgroundColor: '#EEF2FF', color: 'var(--primary)' }}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn" onClick={() => handleDelete(p.id)} style={{ padding: '0.5rem', backgroundColor: '#FEE2E2', color: 'var(--danger)' }}>
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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', backgroundColor: 'white', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {formData.id ? 'Cập nhật hàng hóa' : 'Thêm hàng hóa mới'}
            </h2>
            
            {errorMsg && <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#FEE2E2', color: 'var(--danger)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{errorMsg}</div>}
            {successMsg && <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#D1FAE5', color: 'var(--success)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{successMsg}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Mã sản phẩm (Product ID) *</label>
                  <input type="text" className="input-field" value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Tên sản phẩm *</label>
                  <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Danh mục *</label>
                  <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                    <option value="">Chọn danh mục...</option>
                    <option value="Thực phẩm">Thực phẩm</option>
                    <option value="Đồ uống">Đồ uống</option>
                    <option value="Gia dụng">Gia dụng</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Nhà cung cấp (Supplier ID)</label>
                  <input type="text" className="input-field" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Giá bán (VNĐ) *</label>
                  <input type="number" className="input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required min="1" />
                </div>
                <div className="input-group">
                  <label>Số lượng (Tồn kho) *</label>
                  <input type="number" className="input-field" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required min="1" />
                </div>
              </div>

              <div className="input-group">
                <label>Hạn sử dụng (Expiry Date)</label>
                <input type="date" className="input-field" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
              </div>

              <div className="input-group">
                <label>Mô tả thêm</label>
                <textarea className="input-field" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3"></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: '#F3F4F6' }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{formData.id ? 'Lưu cập nhật' : 'Lưu sản phẩm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPriceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', backgroundColor: 'white' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Cập nhật giá bán
            </h2>
            
            {priceErrorMsg && <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#FEE2E2', color: 'var(--danger)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{priceErrorMsg}</div>}
            {priceSuccessMsg && <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#D1FAE5', color: 'var(--success)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{priceSuccessMsg}</div>}

            <form onSubmit={handlePriceSubmit}>
              <div className="input-group">
                <label>Mã sản phẩm (Product ID) *</label>
                <input type="text" className="input-field" value={priceFormData.productId} onChange={e => setPriceFormData({...priceFormData, productId: e.target.value})} onBlur={handleProductIdBlur} placeholder="Nhập mã rồi click ra ngoài" required />
              </div>
              <div className="input-group">
                <label>Tên sản phẩm</label>
                <input type="text" className="input-field" value={priceFormData.name} readOnly disabled style={{ backgroundColor: '#F3F4F6' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Giá hiện tại</label>
                  <input type="text" className="input-field" value={priceFormData.currentPrice ? Number(priceFormData.currentPrice).toLocaleString() + ' đ' : ''} readOnly disabled style={{ backgroundColor: '#F3F4F6' }} />
                </div>
                <div className="input-group">
                  <label>Giá mới (New Price) *</label>
                  <input type="number" className="input-field" value={priceFormData.newPrice} onChange={e => setPriceFormData({...priceFormData, newPrice: e.target.value})} required min="1" />
                </div>
              </div>
              <div className="input-group">
                <label>Ngày áp dụng (Effective Date)</label>
                <input type="date" className="input-field" value={priceFormData.effectiveDate} onChange={e => setPriceFormData({...priceFormData, effectiveDate: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn" onClick={() => setShowPriceModal(false)} style={{ flex: 1, backgroundColor: '#F3F4F6' }}>Hủy (Cancel)</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#D97706' }}>Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
