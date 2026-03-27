import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BarChart, AlertTriangle, TrendingUp, TrendingDown, Clock, Search } from 'lucide-react';

const Reports = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return navigate('/login');
    // Load un-filtered on initial
    fetchData();
  }, []);

  const fetchData = async (start = '', end = '') => {
    try {
      let query = '';
      if (start && end) {
        query = `?startDate=${start}&endDate=${end}`;
      }
      
      const resSum = await axios.get(`http://localhost:5000/api/reports/summary${query}`, { headers: { Authorization: `Bearer ${token}` } });
      setSummary(resSum.data);
      
      const resHist = await axios.get(`http://localhost:5000/api/orders${query}`, { headers: { Authorization: `Bearer ${token}` } });
      setHistory(resHist.data);
      setErrorMsg('');
    } catch (err) {}
  };

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      setErrorMsg('ERR01 - Invalid date range: Vui lòng chọn đầy đủ Từ ngày và Đến ngày.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg('ERR01 - Invalid date range: Ngày kết thúc không thể nhỏ hơn ngày bắt đầu.');
      return;
    }
    fetchData(startDate, endDate);
  };

  if (!summary) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--bg-color)' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <button className="btn" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', backgroundColor: 'white' }}>
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </button>
        
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <BarChart color="var(--primary)" /> Báo cáo & Thông báo
        </h1>

        {/* Date Filter Form (Sequence Diagram View Summary Report) */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Từ ngày (Start Date)</label>
            <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Đến ngày (End Date)</label>
            <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} style={{ display: 'flex', gap: '0.5rem' }}>
            <Search size={16} /> Lọc Kế Hoạch (Generate)
          </button>
          {errorMsg && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginLeft: '1rem' }}>{errorMsg}</div>}
        </div>

        {summary.lowStockAlerts.length > 0 && (
          <div style={{ padding: '1.5rem', backgroundColor: '#FEF2F2', borderLeft: '4px solid var(--danger)', borderRadius: '0.5rem', marginBottom: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 'bold', marginBottom: '1rem' }}>
              <AlertTriangle size={20} /> Cảnh báo: Tồn kho thấp / Sắp hết hạn
            </h3>
            <ul style={{ paddingLeft: '2rem', color: '#991B1B' }}>
              {summary.lowStockAlerts.map(p => (
                <li key={p.id} style={{ marginBottom: '0.5rem' }}>{p.name} - Còn lại: <strong>{p.stock}</strong></li>
              ))}
            </ul>
          </div>
        )}

        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>1. Báo cáo Tóm tắt (Summary Report)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tổng Sản phẩm</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{summary.totalProducts}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #10B981' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tổng Khách hàng</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{summary.totalCustomers}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #3B82F6' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', gap: '0.25rem' }}><TrendingUp size={14} color="#3B82F6"/> Doanh thu Inward</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3B82F6' }}>{(summary.totalSales || 0).toLocaleString()} đ</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #EF4444' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', gap: '0.25rem' }}><TrendingDown size={14} color="#EF4444"/> Chi phí Outward</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#EF4444' }}>{(summary.totalPurchases || 0).toLocaleString()} đ</div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <Clock size={20} color="var(--primary)" /> 2. Lịch sử luân chuyển (Movement Logs BR-08)
        </h2>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Mã GD</th>
                <th style={{ padding: '1rem' }}>Ngày thực hiện</th>
                <th style={{ padding: '1rem' }}>Khách hàng</th>
                <th style={{ padding: '1rem' }}>Loại</th>
                <th style={{ padding: '1rem' }}>Trị giá</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>MSG01 - No stock movements found</td></tr>
              ) : history.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>#{h.id}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{h.createdAt.split(' ')[0]}</td>
                  <td style={{ padding: '1rem' }}>{h.customerName || '-'}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: h.type === 'SALE' ? '#3B82F6' : '#EF4444' }}>
                    {h.type === 'SALE' ? 'Xuất (Sales)' : 'Nhập (Purchase)'}
                  </td>
                  <td style={{ padding: '1rem' }}>{h.totalAmount.toLocaleString()} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
