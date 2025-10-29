import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminManageItems.css";

export default function AdminManageItems() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();

  // ---------------- Fetch all items ----------------
  useEffect(() => {
    if (!token) {
      setError("No admin token. Please log in.");
      setLoading(false);
      return;
    }

    fetchItems();
  }, [token]);

  const fetchItems = () => {
    setLoading(true);
    axios
      .get(`${API_BASE}/api/admin/items`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      .then((res) => {
        setItems(res.data);
        setFilteredItems(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || "Failed to fetch items");
        setLoading(false);
      });
  };

  // ---------------- Filter items ----------------
  useEffect(() => {
    if (filter === "all") {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.status === filter));
    }
  }, [filter, items]);

  // ---------------- Approve/Reject item ----------------
  const handleAction = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this item?`)) return;

    try {
      const res = await axios.put(
        `${API_BASE}/api/admin/items/approve/${id}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || `Item ${action}d successfully.`);
      fetchItems(); // Refresh the list
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update item.");
    }
  };

  // ---------------- Get image URL ----------------
  const getImageUrl = (photos) => {
    if (photos && photos.length > 0) {
      return `${API_BASE}/uploads/${photos[0]}`;
    }
    return "/placeholder-item.png";
  };

  // ---------------- Get status badge style ----------------
  const getStatusBadge = (status) => {
    const badges = {
      pending: { className: "badge-pending", text: "⏳ Pending" },
      approved: { className: "badge-approved", text: "✅ Approved" },
      rejected: { className: "badge-rejected", text: "❌ Rejected" },
    };
    return badges[status] || badges.pending;
  };

  // ---------------- Render ----------------
  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>📦 Manage Items</h2>
        <button className="back-btn" onClick={() => navigate("/admin")}>
          ⬅ Back to Dashboard
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={filter === "all" ? "active" : ""} 
          onClick={() => setFilter("all")}
        >
          All ({items.length})
        </button>
        <button 
          className={filter === "pending" ? "active" : ""} 
          onClick={() => setFilter("pending")}
        >
          Pending ({items.filter(i => i.status === "pending").length})
        </button>
        <button 
          className={filter === "approved" ? "active" : ""} 
          onClick={() => setFilter("approved")}
        >
          Approved ({items.filter(i => i.status === "approved").length})
        </button>
        <button 
          className={filter === "rejected" ? "active" : ""} 
          onClick={() => setFilter("rejected")}
        >
          Rejected ({items.filter(i => i.status === "rejected").length})
        </button>
      </div>

      {/* Items Table */}
      {filteredItems.length === 0 ? (
        <p className="no-items">No items found for this filter.</p>
      ) : (
        <div className="items-table-container">
          <table className="items-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Years Used</th>
                <th>Seller</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const badge = getStatusBadge(item.status);
                return (
                  <tr key={item._id}>
                    <td>
                      <img 
                        src={getImageUrl(item.photos)} 
                        alt={item.name} 
                        className="item-thumbnail"
                        onError={(e) => (e.target.src = "/placeholder-item.png")}
                      />
                    </td>
                    <td>{item.name}</td>
                    <td>₹{item.price}</td>
                    <td>{item.quantity}</td>
                    <td>{item.yearsUsed} years</td>
                    <td>{item.seller?.name || "N/A"}</td>
                    <td>
                      <span className={`status-badge ${badge.className}`}>
                        {badge.text}
                      </span>
                    </td>
                    <td className="action-buttons">
                      {item.status !== "approved" && (
                        <button 
                          className="approve-btn" 
                          onClick={() => handleAction(item._id, "approve")}
                        >
                          ✅ Approve
                        </button>
                      )}
                      {item.status !== "rejected" && (
                        <button 
                          className="reject-btn" 
                          onClick={() => handleAction(item._id, "reject")}
                        >
                          ❌ Reject
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}