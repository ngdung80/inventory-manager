import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Lock } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem('token');

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
    }
  }, [user, token, navigate]);

  if (!user || !token) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/users/profile', 
        { fullName, email }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
      const updatedUser = { ...user, fullName, email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      setMsg({ type: 'error', text: 'Lỗi cập nhật hồ sơ' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/users/password', 
        { oldPassword, newPassword }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Lỗi đổi mật khẩu' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--bg-color)' }}>
      <div className="container">
        <button className="btn" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', backgroundColor: 'white' }}>
          <ArrowLeft size={16} /> Quay lại thẻ Tổng quan
        </button>
        
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>Hồ sơ cá nhân</h1>
        
        {msg.text && (
          <div style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', backgroundColor: msg.type === 'success' ? '#D1FAE5' : '#FEE2E2', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="var(--primary)" /> Thông tin cá nhân
            </h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="input-group">
                <label>Họ và tên</label>
                <input type="text" className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nhập họ và tên" />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="Nhập email" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Lưu thay đổi</button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={20} color="var(--primary)" /> Đổi mật khẩu
            </h2>
            <form onSubmit={handleChangePassword}>
              <div className="input-group">
                <label>Mật khẩu cũ</label>
                <input type="password" className="input-field" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Mật khẩu mới</label>
                <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Đổi mật khẩu</button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
