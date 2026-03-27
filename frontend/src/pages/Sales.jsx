import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ShoppingCart, Receipt, Trash2, Plus, Minus } from 'lucide-react';

const Sales = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState([]); // [{ product, quantity }]
  
  const [taxRate, setTaxRate] = useState(10);
  const [discountAmt, setDiscountAmt] = useState(0);

  useEffect(() => {
    if (!token) return navigate('/login');
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const resP = await axios.get('http://localhost:5000/api/products', { headers: { Authorization: `Bearer ${token}` } });
      const resC = await axios.get('http://localhost:5000/api/customers', { headers: { Authorization: `Bearer ${token}` } });
      setProducts(resP.data);
      setCustomers(resC.data);
    } catch (err) {}
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert('Vượt quá số lượng tồn kho!'); return;
      }
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.stock < 1) {
        alert('Sản phẩm đã hết hàng!'); return;
      }
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        if (newQ > item.product.stock) { alert('Vượt quá tồn kho!'); return item; }
        if (newQ < 1) return item;
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const subTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cart]);
  const calculatedTax = useMemo(() => subTotal * (taxRate / 100), [subTotal, taxRate]);
  const grandTotal = useMemo(() => subTotal + calculatedTax - discountAmt, [subTotal, calculatedTax, discountAmt]);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Giỏ hàng đang trống!');
    if (grandTotal < 0) return alert('Tổng tiền không tính toán hợp lệ!');
    
    try {
      const payload = {
        type: 'SALE',
        customerId: selectedCustomerId || null,
        totalAmount: grandTotal,
        status: 'COMPLETED',
        items: cart.map(c => ({
          productId: c.product.id,
          quantity: c.quantity,
          price: c.product.price
        }))
      };
      
      await axios.post('http://localhost:5000/api/orders', payload, { headers: { Authorization: `Bearer ${token}` } });
      alert('Tạo biên lai và trừ hàng (deductStock) thành công!');
      
      setCart([]);
      setSelectedCustomerId('');
      setTaxRate(10);
      setDiscountAmt(0);
      fetchInitialData(); 
    } catch (err) {
      alert('Lỗi xuất biên lai!');
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--bg-color)' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        <button className="btn" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', backgroundColor: 'white' }}>
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </button>
        
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <ShoppingCart color="var(--primary)" /> Bán hàng (Quét Mã/Tạo Biên lai)
        </h1>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ flex: 2, padding: '1.5rem', minWidth: '350px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Danh sách Hàng hóa (Scanner)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {products.map(p => (
                <div key={p.id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '0.5rem', backgroundColor: p.stock > 0 ? 'white' : '#F3F4F6' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{p.name}</div>
                  <div style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{p.price.toLocaleString()} đ</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Tồn kho: {p.stock}</div>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem' }} disabled={p.stock < 1} onClick={() => addToCart(p)}>
                    Thêm vào thẻ / Giỏ hàng
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', backgroundColor: 'white', minWidth: '350px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Chi tiết Biên lai (Receipt)</h2>
            
            <div className="input-group">
              <label>Khách hàng (Customer)</label>
              <select className="input-field" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                <option value="">-- Tính là Khách lẻ --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1rem 0', minHeight: '150px' }}>
              {cart.map(item => (
                <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{item.product.name}</div>
                    <div style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>{item.product.price.toLocaleString()} đ</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => updateQuantity(item.product.id, -1)} style={{ padding: '0.2rem', borderRadius: '0.25rem', border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent' }}><Minus size={14}/></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} style={{ padding: '0.2rem', borderRadius: '0.25rem', border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent' }}><Plus size={14}/></button>
                    <button onClick={() => removeFromCart(item.product.id)} style={{ padding: '0.2rem', color: 'red', border: 'none', background: 'transparent', cursor: 'pointer', marginLeft: '0.5rem' }}><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>Chưa chọn mặt hàng nào</div>}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Cộng dồn (SubTotal):</span>
                <span>{subTotal.toLocaleString()} đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span>Thuế (Tax) %:</span>
                <input type="number" style={{ width: '60px', padding: '0.25rem', textAlign: 'right' }} value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <span>Giá giảm (Discount):</span>
                <input type="number" style={{ width: '100px', padding: '0.25rem', textAlign: 'right' }} value={discountAmt} onChange={e => setDiscountAmt(Number(e.target.value))} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)', borderTop: '2px dashed var(--border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                <span>Tổng Biên lai:</span>
                <span>{grandTotal > 0 ? grandTotal.toLocaleString() : 0} đ</span>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }} onClick={handleCheckout}>
                <Receipt size={20} /> Process Biên lai & Trừ Kho
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
