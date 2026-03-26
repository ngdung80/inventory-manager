import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ShoppingCart, FileText, Plus, Minus } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Purchases = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [activeTab, setActiveTab] = useState('PLACE_ORDER');

  // --- PLACE ORDER (UC-07) ---
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [cart, setCart] = useState([]);
  
  // --- INVOICE (UC-08) ---
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    if (!token) return navigate('/login');
    fetchSuppliers();
    fetchProducts();
    fetchPendingOrders();
  }, [activeTab]);

  const fetchSuppliers = async () => {
    const res = await axios.get('http://localhost:5000/api/suppliers', { headers: { Authorization: `Bearer ${token}` } });
    setSuppliers(res.data);
  };
  const fetchProducts = async () => {
    const res = await axios.get('http://localhost:5000/api/products', { headers: { Authorization: `Bearer ${token}` } });
    setProducts(res.data);
  };
  const fetchPendingOrders = async () => {
    const res = await axios.get('http://localhost:5000/api/orders?type=PURCHASE&status=PENDING', { headers: { Authorization: `Bearer ${token}` } });
    setPendingOrders(res.data);
  };

  const addToCart = (product) => {
    // BR-06: The system must check if the stock is below the "ReorderLevel" before allowing a new order to be placed.
    if (product.stock > product.reorderLevel) {
      alert(`BR-06: Tồn kho (${product.stock}) hiện đang cao hơn mức tái đặt hàng (${product.reorderLevel}). Không cho phép đặt hàng sỉ!`);
      return;
    }

    const existing = cart.find(item => item.product.id === product.id);
    if (existing) setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    else setCart([...cart, { product, quantity: 1 }]);
  };
  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => item.product.id === id ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0));
  };
  const subTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cart]);

  const handlePlaceOrder = async () => {
    if (!selectedSupplierId) return alert('Vui lòng chọn Nhà cung cấp!');
    if (cart.length === 0) return alert('Chưa chọn sản phẩm nào để đặt!');
    try {
      await axios.post('http://localhost:5000/api/orders', {
        type: 'PURCHASE',
        supplierId: selectedSupplierId,
        totalAmount: subTotal,
        status: 'PENDING',
        items: cart.map(c => ({ productId: c.product.id, quantity: c.quantity, price: c.product.price }))
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Tạo Yêu cầu Đặt hàng (Place Order) thành công! Phiếu đang chờ Xác nhận Nhập Kho ở tab Kế bên.');
      setCart([]); setSelectedSupplierId('');
      fetchPendingOrders();
      setActiveTab('INVOICE'); // Chuyển sang Invoice ngay
    } catch (err) { 
      const errMsg = err.response?.data?.error || err.message;
      alert('Lỗi: ' + errMsg); 
    }
  };

  const selectOrder = async (orderId) => {
    const order = pendingOrders.find(o => o.id == orderId);
    setSelectedOrder(order);
    if (order) {
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/${order.id}/items`, { headers: { Authorization: `Bearer ${token}` } });
        setOrderItems(res.data);
      } catch (err) {
        console.error("Fetch items error:", err);
      }
    } else {
      setOrderItems([]);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedOrder) return;
    try {
      await axios.put(`http://localhost:5000/api/orders/${selectedOrder.id}/invoice`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Đã lập Hóa đơn (Generate Invoice)! Số lượng tồn kho đã được CỘNG THÊM thành công!');
      setSelectedOrder(null);
      fetchPendingOrders();
      fetchProducts();
    } catch (err) { alert('Lỗi: ' + err.message); }
  };

  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleExportPDF = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;
    
    // Use html2canvas to capture the element as an image
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    // Create jsPDF instance
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`DonDatHang_PO${selectedOrder.id}.pdf`);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--bg-color)' }}>
      {/* CSS for print mode */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="container" style={{ maxWidth: '1200px' }}>
        <button className="btn no-print" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', backgroundColor: 'white' }}>
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </button>
        
        <h1 className="no-print" style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <ShoppingCart color="var(--primary)" /> Luồng Nhập Hàng (Purchasing Flow)
        </h1>

        <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button className={`btn ${activeTab === 'PLACE_ORDER' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('PLACE_ORDER')} style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}>
            1. Đặt Hàng (Place Order)
          </button>
          <button className={`btn ${activeTab === 'INVOICE' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('INVOICE')} style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}>
            2. Tạo Hóa Đơn Nhập (Generate Invoice)
          </button>
        </div>

        {activeTab === 'PLACE_ORDER' && (
          <div className="no-print" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="glass-panel" style={{ flex: 2, padding: '1.5rem', minWidth: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Sản phẩm cần đặt (BR-06)</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>*Chỉ cho phép đặt khi Stock ≤ ReorderLevel</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {products.map(p => (
                  <div key={p.id} style={{ 
                    border: '1px solid var(--border)', 
                    padding: '1rem', 
                    borderRadius: '0.5rem', 
                    backgroundColor: p.stock <= p.reorderLevel ? 'white' : '#F9FAFB',
                    opacity: p.stock <= p.reorderLevel ? 1 : 0.7
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{p.name}</div>
                    <div style={{ color: p.stock <= p.reorderLevel ? 'red' : 'green', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '500' }}>
                      Stock: {p.stock} / Reorder: {p.reorderLevel}
                    </div>
                    <div style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Giá nhập: {p.price.toLocaleString()} đ</div>
                    <button 
                      className="btn btn-primary" 
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        fontSize: '0.9rem',
                        backgroundColor: p.stock <= p.reorderLevel ? 'var(--primary)' : '#6B7280'
                      }} 
                      onClick={() => addToCart(p)}
                    >
                      {p.stock <= p.reorderLevel ? 'Chọn mua' : 'Đủ tồn kho'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', minWidth: '350px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Phiếu Đặt Hàng</h2>
              <div className="input-group">
                <label>Nhà cung cấp (Supplier)</label>
                <select className="input-field" value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}>
                  <option value="">-- Chọn Nhà cung cấp --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} - {s.contact}</option>)}
                </select>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 0', minHeight: '150px' }}>
                {cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div><div style={{ fontWeight: '500' }}>{item.product.name}</div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => updateQuantity(item.product.id, -1)} style={{ padding: '0.2rem', cursor: 'pointer' }}><Minus size={14}/></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} style={{ padding: '0.2rem', cursor: 'pointer' }}><Plus size={14}/></button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <p style={{color:'var(--text-muted)'}}>Giỏ rỗng</p>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', paddingTop: '1rem', borderTop: '2px dashed var(--border)' }}>
                <span>Tổng chi phí:</span><span>{subTotal.toLocaleString()} đ</span>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1.5rem' }} onClick={handlePlaceOrder}>
                 Lưu Phiếu (Save Order)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'INVOICE' && (
          <div className="no-print" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', minWidth: '350px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Phiếu Chờ (Pending Orders)</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto' }}>
                {pendingOrders.map(o => (
                  <div 
                    key={o.id} 
                    onClick={() => selectOrder(o.id)}
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '0.5rem', 
                      border: selectedOrder?.id === o.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: selectedOrder?.id === o.id ? '#EEF2FF' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', color: selectedOrder?.id === o.id ? 'var(--primary)' : 'black' }}>
                        #{o.id} - {o.supplierName || 'Nhà cung cấp'}
                      </div>
                      <div style={{ color: 'var(--primary)', marginTop: '0.25rem', fontWeight: '500' }}>
                        {o.totalAmount.toLocaleString()} đ
                      </div>
                    </div>
                    {selectedOrder?.id === o.id && (
                      <button 
                        className="btn" 
                        onClick={(e) => { e.stopPropagation(); setShowPrintModal(true); }}
                        style={{ padding: '0.4rem', backgroundColor: 'white', border: '1px solid var(--border)' }}
                        title="Xem bản in Đơn đặt hàng"
                      >
                        <FileText size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {pendingOrders.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Chưa có phiếu đặt hàng nào đang chờ.</p>}
            </div>

            <div className="glass-panel" style={{ flex: 2, padding: '1.5rem', minWidth: '350px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Lập Hóa đơn (Generate Invoice)</h2>
              {selectedOrder ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                    <p><strong>Mã Đơn:</strong> #{selectedOrder.id}</p>
                    <p><strong>Ngày tạo:</strong> {selectedOrder.createdAt.split(' ')[0]}</p>
                    <p><strong>Nhà cung cấp:</strong> {selectedOrder.supplierName}</p>
                    <p><strong>Trạng thái:</strong> <span style={{ color: '#D97706', fontWeight: 'bold' }}>{selectedOrder.status}</span></p>
                  </div>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: '0.75rem' }}>Mặt hàng</th>
                        <th style={{ padding: '0.75rem' }}>Số lượng</th>
                        <th style={{ padding: '0.75rem' }}> đơn giá</th>
                        <th style={{ padding: '0.75rem' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem' }}>{item.name}</td>
                          <td style={{ padding: '0.75rem' }}>{item.quantity}</td>
                          <td style={{ padding: '0.75rem' }}>{item.price.toLocaleString()}</td>
                          <td style={{ padding: '0.75rem' }}>{(item.quantity * item.price).toLocaleString()} đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 'bold', fontSize: '1.5rem', paddingTop: '1.5rem', color: 'var(--primary)' }}>
                    <span>Tổng hóa đơn: {selectedOrder.totalAmount.toLocaleString()} đ</span>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} onClick={handleGenerateInvoice}>
                    <FileText size={20} /> Xác nhận Generate Invoice (Bắt đầu Cộng Tồn Kho)
                  </button>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '4rem', padding: '2rem', border: '2px dashed var(--border)', borderRadius: '0.5rem' }}>
                  Vui lòng chọn 1 Phiếu yêu cầu (PENDING) bên trái.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showPrintModal && selectedOrder && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', backgroundColor: 'white', position: 'relative' }}>
            <button 
              onClick={() => setShowPrintModal(false)}
              style={{ position: 'absolute', right: '1rem', top: '1rem', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ×
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Xem trước Đơn Đặt Hàng</h2>
              <button className="btn btn-primary" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} /> Xuất PDF Đơn Hàng
              </button>
            </div>

            <div id="print-area" style={{ border: '1px solid #eee', padding: '40px', backgroundColor: 'white', color: 'black', fontFamily: 'serif' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid black', paddingBottom: '20px', marginBottom: '30px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>HỆ THỐNG QUẢN LÝ KHO</h1>
                  <p style={{ margin: '5px 0' }}>Địa chỉ: 123 Đường ABC, Hà Nội</p>
                  <p style={{ margin: '5px 0' }}>Hotline: 0123 456 789</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', margin: 0 }}>ĐƠN ĐẶT HÀNG</h1>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>Số: PO-{selectedOrder.id}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
                <div>
                  <h3 style={{ borderBottom: '1px solid grey', paddingBottom: '5px' }}>THÔNG TIN NHÀ CUNG CẤP</h3>
                  <p><strong>Tên:</strong> {selectedOrder.supplierName}</p>
                  <p><strong>Liên hệ:</strong> {selectedOrder.supplierContact || 'N/A'}</p>
                </div>
                <div>
                  <h3 style={{ borderBottom: '1px solid grey', paddingBottom: '5px' }}>THÔNG TIN GIAO HÀNG</h3>
                  <p><strong>Ngày đặt hàng:</strong> {selectedOrder.createdAt}</p>
                  <p><strong>Kho nhận:</strong> Kho Trung Tâm</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2' }}>
                    <th style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>STT</th>
                    <th style={{ border: '1px solid black', padding: '10px' }}>Mô tả sản phẩm</th>
                    <th style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>Số lượng</th>
                    <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid black', padding: '10px' }}>{item.name}</td>
                      <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>{item.price.toLocaleString()}</td>
                      <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right' }}>{(item.quantity * item.price).toLocaleString()} đ</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>TỔNG CỘNG:</td>
                    <td style={{ border: '1px solid black', padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>
                      {selectedOrder.totalAmount.toLocaleString()} đ
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', textAlign: 'center', marginTop: '60px' }}>
                <div>
                  <p style={{ fontWeight: 'bold' }}>ĐẠI DIỆN BÊN MUA</p>
                  <p style={{ fontSize: '12px', fontStyle: 'italic', marginBottom: '60px' }}>(Ký và ghi rõ họ tên)</p>
                  <p>........................................</p>
                </div>
                <div>
                   <p style={{ fontWeight: 'bold' }}>ĐẠI DIỆN NHÀ CUNG CẤP</p>
                   <p style={{ fontSize: '12px', fontStyle: 'italic', marginBottom: '60px' }}>(Ký và ghi rõ họ tên)</p>
                   <p>........................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
