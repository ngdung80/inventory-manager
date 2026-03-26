import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ShoppingCart, Receipt, Trash2, Plus, Minus, Search, X, Undo, RefreshCw } from 'lucide-react';
import useCart from '../hooks/useCart';

const Sales = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  const {
    cartItems,
    taxRate,
    setTaxRate,
    discount,
    setDiscount,
    subtotal,
    taxAmount,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  useEffect(() => {
    if (!token) return navigate('/login');
    fetchInitialData();
    fetchReceipts();
  }, []);

  const fetchInitialData = async () => {
    try {
      const resP = await axios.get('http://localhost:5000/api/products', { headers: { Authorization: `Bearer ${token}` } });
      const resC = await axios.get('http://localhost:5000/api/customers', { headers: { Authorization: `Bearer ${token}` } });
      setProducts(resP.data);
      setCustomers(resC.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchReceipts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/receipts', { headers: { Authorization: `Bearer ${token}` } });
      setReceipts(res.data);
    } catch (err) {
      console.error('Error fetching receipts:', err);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return alert('Giỏ hàng đang trống!');
    if (total < 0) return alert('Tổng tiền không hợp lệ (không được âm)!');
    
    try {
      const payload = {
        customerId: selectedCustomerId || null,
        totalAmount: total,
        tax: taxRate,
        discount: discount,
        items: cartItems.map(c => ({
          productId: c.product.id,
          quantity: c.quantity,
          price: c.product.price
        }))
      };
      
      await axios.post('http://localhost:5000/api/receipts', payload, { headers: { Authorization: `Bearer ${token}` } });
      alert('Thanh toán thành công!');
      
      clearCart();
      setSelectedCustomerId('');
      fetchInitialData(); 
      fetchReceipts();
    } catch (err) {
      alert('Thanh toán thất bại: ' + (err.response?.data?.error || err.message));
    }
  };

  const cancelReceipt = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy hóa đơn này? Thao tác này sẽ hoàn lại kho hàng.')) return;
    try {
      await axios.post(`http://localhost:5000/api/receipts/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Đã hủy hóa đơn!');
      fetchReceipts();
      fetchInitialData();
    } catch (err) {
      alert('Hủy hóa đơn thất bại');
    }
  };

  const handleReplaceItem = async (receiptId, oldProductId) => {
    const newProductIdStr = prompt('Nhập ID Sản phẩm mới để thay thế:');
    if (!newProductIdStr) return;
    const newProductId = parseInt(newProductIdStr);
    const newQuantityStr = prompt('Nhập số lượng mới:');
    if (!newQuantityStr) return;
    const newQuantity = parseInt(newQuantityStr);

    try {
      await axios.post(`http://localhost:5000/api/receipts/${receiptId}/replace`, {
        oldProductId,
        newProductId,
        newQuantity
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Đã đổi trả sản phẩm thành công!');
      fetchReceipts();
      fetchInitialData();
    } catch (err) {
      alert('Đổi trả thất bại: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: '#f8fafc' }}>
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button className="btn" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <ArrowLeft size={16} /> Quay lại Tổng quan
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart color="#6366f1" /> Máy tính tiền POS
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '2rem' }}>
          {/* Left Side: Product Selection and Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                <input 
                  type="text" 
                  placeholder="Tìm sản phẩm theo tên..." 
                  className="input-field" 
                  style={{ paddingLeft: '3rem', width: '100%', border: '1px solid #cbd5e1', borderRadius: '0.5rem', height: '3rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', maxHeight: '500px', overflowY: 'auto', padding: '0.5rem' }}>
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={() => p.stock > 0 && addToCart(p)} style={{ 
                    border: '1px solid #e2e8f0', 
                    padding: '1rem', 
                    borderRadius: '0.75rem', 
                    backgroundColor: p.stock > 0 ? 'white' : '#f1f5f9',
                    cursor: p.stock > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    opacity: p.stock > 0 ? 1 : 0.6
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{p.name}</div>
                    <div style={{ color: '#6366f1', fontWeight: '600', marginBottom: '0.5rem' }}>{p.price.toLocaleString()} đ</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Kho: {p.stock}</span>
                      {p.stock > 0 ? <Plus size={18} color="#6366f1" /> : <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>Hết hàng</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Receipts Section */}
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={20} color="#6366f1" /> Hóa đơn Gần đây
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>
                      <th style={{ padding: '0.75rem' }}>Mã HĐ</th>
                      <th style={{ padding: '0.75rem' }}>Khách hàng</th>
                      <th style={{ padding: '0.75rem' }}>Tổng tiền</th>
                      <th style={{ padding: '0.75rem' }}>Trạng thái</th>
                      <th style={{ padding: '0.75rem' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                        <td style={{ padding: '0.75rem' }}>#{r.id}</td>
                        <td style={{ padding: '0.75rem' }}>{r.Customer?.name || 'Walk-in'}</td>
                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>{r.totalAmount.toLocaleString()} đ</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '1rem', 
                            fontSize: '0.75rem', 
                            backgroundColor: r.status === 'COMPLETED' ? '#dcfce7' : '#fee2e2',
                            color: r.status === 'COMPLETED' ? '#166534' : '#991b1b'
                          }}>{r.status}</span>
                        </td>
                        <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                          {r.status === 'COMPLETED' && (
                            <>
                              <button onClick={() => cancelReceipt(r.id)} title="Hủy & Hoàn kho" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Undo size={16} /></button>
                              <button onClick={() => handleReplaceItem(r.id, r.ReceiptItems[0]?.productId)} title="Đổi trả hàng" style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}><RefreshCw size={16} /></button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Side: Cart Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Thanh toán</h2>
              
              <div className="input-group">
                <label style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Khách hàng</label>
                <select className="input-field" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                  <option value="">Khách vãng lai</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', minHeight: '300px' }}>
                {cartItems.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{item.product.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{item.product.price.toLocaleString()} đ × {item.quantity}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', padding: '0.25rem' }}>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} style={{ padding: '0.2rem', background: 'none', border: 'none', cursor: 'pointer' }}><Minus size={14}/></button>
                        <span style={{ width: '2rem', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} style={{ padding: '0.2rem', background: 'none', border: 'none', cursor: 'pointer' }}><Plus size={14}/></button>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
                {cartItems.length === 0 && (
                  <div style={{ textAlign: 'center', marginTop: '4rem', color: '#94a3b8' }}>
                    <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>Giỏ hàng đang trống</p>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                  <span style={{ color: '#64748b' }}>Tạm tính</span>
                  <span>{subtotal.toLocaleString()} đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Thuế (%)</span>
                  <input type="number" style={{ width: '60px', padding: '0.4rem', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '0.4rem' }} value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Chiết khấu (đ)</span>
                  <input type="number" style={{ width: '100px', padding: '0.4rem', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '0.4rem' }} value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.4rem', color: '#1e293b', borderTop: '2px dashed #e2e8f0', paddingTop: '1rem', marginBottom: '2rem' }}>
                  <span>Tổng cộng</span>
                  <span style={{ color: '#6366f1' }}>{total > 0 ? total.toLocaleString() : 0} đ</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={clearCart} className="btn" style={{ flex: 1, padding: '1rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Xóa hết</button>
                  <button onClick={handleCheckout} className="btn btn-primary" style={{ flex: 2, padding: '1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Receipt size={20} /> Thanh toán
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
