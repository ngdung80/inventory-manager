import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Store } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'var(--primary)', borderRadius: '50%', marginBottom: '1rem' }}>
            <Store color="white" size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Hệ Thống Quản Lý</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Đăng nhập để tiếp tục</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Tên đăng nhập</label>
            <input 
              type="text" 
              className="input-field" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="admin"
              required 
            />
          </div>
          <div className="input-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
