// pages/admin/AdminAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Users, Package, ShoppingCart, TrendingUp, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminAnalytics = ({ user, handleLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    totalItems: 0,
    totalSales: 0,
    onlineSales: 0,
    offlineSales: 0,
    userBreakdown: [],
    itemCategories: [],
  });

  useEffect(() => {
    fetchAnalyticsData();
    
    // Auto-refresh every 30 seconds for real-time sync
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logoutAndRedirect = () => {
    handleLogout();
    navigate("/admin-login");
  };

  const salesModeData = [
    { name: 'Online Sales', value: analyticsData.onlineSales, color: '#10b981' },
    { name: 'Offline Sales', value: analyticsData.offlineSales, color: '#34d399' }
  ];

  const StatCard = ({ icon: Icon, title, value, bgColor, iconColor }) => (
    <div className={`stat-card ${bgColor}`}>
      <div className="stat-content">
        <div>
          <p className="stat-title">{title}</p>
          <p className="stat-value">
            {loading ? (
              <Loader className="spinner" />
            ) : (
              value.toLocaleString()
            )}
          </p>
        </div>
        <div className={`stat-icon ${iconColor}`}>
          <Icon size={32} />
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, data, total, subtitle, icon: Icon }) => (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-icon-wrapper">
          <Icon size={24} />
        </div>
        <div>
          <h3 className="chart-title">{title}</h3>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      </div>
      
      {loading ? (
        <div className="chart-loading">
          <Loader className="spinner-large" />
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => value.toLocaleString()}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => `${value}: ${entry.payload.value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="chart-total">
            <p className="chart-total-label">Total Count</p>
            <p className="chart-total-value">{total.toLocaleString()}</p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="admin-container">
      {/* Navbar */}
      <div className="navbar">
        <h1>Campus Aggregator - Admin</h1>
        <div>
          Welcome, {user?.name || user?.username || "Admin"}
          <button onClick={logoutAndRedirect}>Logout</button>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="analytics-section">
        <div className="analytics-header">
          <div className="analytics-header-left">
            <button onClick={() => navigate('/admin')} className="back-button">
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <div>
              <h2 className="analytics-title">Analytics Dashboard</h2>
              <p className="analytics-subtitle">Real-time overview of platform metrics (Auto-refreshes every 30s)</p>
            </div>
          </div>
          <button 
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="refresh-button"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {error ? (
          <div className="error-card">
            <AlertCircle size={32} />
            <div>
              <h3>Error Loading Analytics</h3>
              <p>{error}</p>
              <button onClick={fetchAnalyticsData} className="retry-button">
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <StatCard
                icon={Users}
                title="Total Users"
                value={analyticsData.totalUsers}
                bgColor="bg-blue"
                iconColor="icon-blue"
              />
              <StatCard
                icon={Package}
                title="Total Items"
                value={analyticsData.totalItems}
                bgColor="bg-purple"
                iconColor="icon-purple"
              />
              <StatCard
                icon={ShoppingCart}
                title="Total Sales"
                value={analyticsData.totalSales}
                bgColor="bg-green"
                iconColor="icon-green"
              />
            </div>

            {/* Sales Distribution Chart - Full Width */}
            <div className="chart-single">
              <ChartCard
                title="Sales Distribution"
                subtitle="Online vs Offline payment modes"
                data={salesModeData}
                total={analyticsData.totalSales}
                icon={TrendingUp}
              />
            </div>

            {/* Footer Info */}
            <div className="analytics-footer">
              <p>📊 Data syncs in real-time from your MongoDB database</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;