import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Package, Users, ShoppingCart, BarChart, Truck } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package color="var(--primary)" /> StoreManager
        </h2>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={() => navigate('/reports')} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#EEF2FF', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500', width: '100%', textAlign: 'left', fontSize: '1rem' }}>
            <BarChart size={20} /> Tổng quan / Báo cáo
          </button>
          <button onClick={() => navigate('/inventory')} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', width: '100%', textAlign: 'left', fontSize: '1rem' }}>
            <Package size={20} /> Kho hàng
          </button>
          <button onClick={() => navigate('/suppliers')} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', width: '100%', textAlign: 'left', fontSize: '1rem' }}>
            <Users size={20} /> Nhà cung cấp
          </button>
          <button onClick={() => navigate('/purchases')} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', width: '100%', textAlign: 'left', fontSize: '1rem' }}>
            <ShoppingCart size={20} /> Nhập hàng (Mua vào)
          </button>
          <button onClick={() => navigate('/customers')} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', width: '100%', textAlign: 'left', fontSize: '1rem' }}>
            <User size={20} /> Khách hàng
          </button>
          <button onClick={() => navigate('/sales')} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', width: '100%', textAlign: 'left', fontSize: '1rem' }}>
            <ShoppingCart size={20} /> Bán hàng (POS)
          </button>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {(user.username || user.fullName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: '500' }}>{user.fullName || user.username || 'User'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role} (Xem Hồ sơ)</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-muted)' }}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', backgroundColor: 'var(--bg-color)' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Tổng quan</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Vai trò của bạn: <strong>{user.role}</strong>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Chào mừng trở lại! Vui lòng chọn các chức năng ở menu bên trái.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
