// pages/admin/AdminDashboard.jsx
import React from "react";
import "./AdminDashboard.css";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard({ user, handleLogout }) {
  const navigate = useNavigate();

  const logoutAndRedirect = () => {
    handleLogout();
    navigate("/admin-login");
  };

  return (
    <div className="admin-container">
      <div className="navbar">
        <h1>Campus Aggregator - Admin</h1>
        <div>
          Welcome, {user?.name || user?.username || "Admin"}
          <button onClick={logoutAndRedirect}>Logout</button>
        </div>
      </div>

      <div className="options-grid">
        <div onClick={() => navigate("/admin/manage-users")}>
          <h2>Manage Users</h2>
        </div>
        <div onClick={() => navigate("/admin/manage-items")}>
          <h2>Manage Items</h2>
        </div>
        <div onClick={() => navigate("/admin/analytics")}>
          <h2>Analytics Dashboard</h2>
        </div>
      </div>
    </div>
  );
}