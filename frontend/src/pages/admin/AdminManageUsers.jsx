import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminManageUser.css"; // Correct CSS import

export default function AdminManageUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!token) {
      setError("No admin token. Login required.");
      return;
    }
    axios
      .get(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(res.data))
      .catch(err => setError(err.response?.data?.message || "Failed to fetch users"));
  }, [token]);

  return (
    <div className="admin-manage-users">
      <h2>Manage Users</h2>
      {error && <p className="error-message">{error}</p>}
      <table className="users-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
