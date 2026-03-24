import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Purchases from './pages/Purchases';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
