// frontend/src/pages/MyItems.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MyItems.css";

function MyItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Fetch items immediately after setting user
        fetchUserItemsWithId(parsedUser._id);
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error("Error reading user from localStorage", err);
      navigate("/login");
    }
  }, [navigate]);

  const fetchUserItemsWithId = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login again - No token found");
        setLoading(false);
        navigate("/login");
        return;
      }

      console.log("🔍 Fetching items for user:", userId);
      console.log("📡 API URL:", `${API_BASE}/api/items/user/${userId}`);

      const response = await fetch(`${API_BASE}/api/items/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Error response:", errorData);
        
        if (response.status === 401 || response.status === 403) {
          throw new Error("Unauthorized. Please login again.");
        }
        throw new Error(errorData.error || "Failed to fetch items");
      }

      const data = await response.json();
      console.log("✅ Items fetched:", data.length);
      setItems(data || []);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching user items:", err);
      setError(err.message || "Network error - Check if backend is running");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login again - No token found");
        setLoading(false);
        navigate("/login");
        return;
      }

      console.log("🔍 Fetching items for user:", user._id);
      console.log("📡 API URL:", `${API_BASE}/api/items/user/${user._id}`);

      const response = await fetch(`${API_BASE}/api/items/user/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Error response:", errorData);
        
        if (response.status === 401 || response.status === 403) {
          throw new Error("Unauthorized. Please login again.");
        }
        throw new Error(errorData.error || "Failed to fetch items");
      }

      const data = await response.json();
      console.log("✅ Items fetched:", data.length);
      setItems(data || []);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching user items:", err);
      setError(err.message || "Network error - Check if backend is running");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE}/api/items/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete item");
      }

      // Remove item from state
      setItems(items.filter(item => item._id !== itemId));
      setDeleteConfirm(null);
      
      // Show success message (optional)
      alert("Item deleted successfully!");
    } catch (err) {
      console.error("❌ Error deleting item:", err);
      alert(err.message || "Failed to delete item");
    }
  };

  const handleEditItem = (itemId) => {
    navigate(`/edit-item/${itemId}`);
  };

  const getItemsByStatus = (status) => {
    return items.filter((item) => item.status === status);
  };

  const approvedItems = getItemsByStatus("approved");
  const pendingItems = getItemsByStatus("pending");
  const rejectedItems = getItemsByStatus("rejected");

  const getItemPhotoUrl = (photos) => {
    if (!photos || photos.length === 0) {
      return "/placeholder-item.png";
    }
    return `${API_BASE}/uploads/${photos[0]}`;
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      approved: { icon: "✅", label: "Approved", class: "status-approved" },
      pending: { icon: "⏳", label: "Pending", class: "status-pending" },
      rejected: { icon: "❌", label: "Rejected", class: "status-rejected" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const ItemCard = ({ item }) => {
    return (
      <div className="my-item-card">
        <div className="item-image-wrapper">
          <img
            src={getItemPhotoUrl(item.photos)}
            alt={item.name}
            className="item-image"
            onError={(e) => (e.target.src = "/placeholder-item.png")}
          />
          <div className="item-status-overlay">
            <StatusBadge status={item.status} />
          </div>
        </div>

        <div className="item-details">
          <h3 className="item-name">{item.name}</h3>

          <div className="item-info-row">
            <span className="item-price">₹{item.price}</span>
            <span className={`item-quantity ${item.quantity === 0 ? 'out-of-stock' : ''}`}>
              {item.quantity === 0 ? "Out of Stock" : `${item.quantity} available`}
            </span>
          </div>

          <div className="item-meta">
            <p className="item-meta-item">
              <span className="meta-icon">📅</span>
              Used: {item.yearsUsed} {item.yearsUsed === 1 ? "year" : "years"}
            </p>
            <p className="item-meta-item">
              <span className="meta-icon">
                {item.deliveryOption === "seller_delivery" ? "🚚" : "🏃"}
              </span>
              {item.deliveryOption === "seller_delivery"
                ? "Seller Delivery"
                : "Buyer Pickup"}
            </p>
          </div>

          <p className="item-date">
            Added: {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          {/* Action Buttons - Only show for pending items */}
          {item.status === "pending" && (
            <div className="item-actions">
              <button 
                onClick={() => handleEditItem(item._id)} 
                className="edit-btn"
                title="Edit Item"
              >
                ✏️ Edit
              </button>
              <button 
                onClick={() => setDeleteConfirm(item._id)} 
                className="delete-btn"
                title="Delete Item"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ItemSection = ({ title, items, emoji, emptyMessage }) => {
    return (
      <div className="items-section">
        <h2 className="section-title">
          <span className="section-emoji">{emoji}</span>
          <span className="section-text">{title}</span>
          <span className="section-count">({items.length})</span>
        </h2>

        {items.length === 0 ? (
          <div className="empty-section">
            <p className="empty-message">{emptyMessage}</p>
          </div>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="my-items-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-items-container">
        <div className="error-state">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button onClick={fetchUserItems} className="retry-btn">
            🔄 Try Again
          </button>
          <button onClick={() => navigate("/home")} className="back-btn">
            ⬅ Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-items-container">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Confirm Delete</h3>
            <p>Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                onClick={() => handleDeleteItem(deleteConfirm)} 
                className="confirm-delete-btn"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="my-items-header">
        <div className="header-content">
          <button onClick={() => navigate("/home")} className="back-button">
            ⬅ Back to Home
          </button>
          <h1 className="page-title">My Items</h1>
          <p className="page-subtitle">
            Manage all items you've added to the platform
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="my-items-content">
        {items.length === 0 ? (
          <div className="no-items-state">
            <div className="no-items-icon">📦</div>
            <h2>No items added yet</h2>
            <p>Start by adding your first item to the platform</p>
            <button
              onClick={() => navigate("/add-item")}
              className="add-item-btn"
            >
              ➕ Add New Item
            </button>
          </div>
        ) : (
          <>
            <ItemSection
              title="Approved Items"
              items={approvedItems}
              emoji="✅"
              emptyMessage="No approved items yet. Items will appear here once admin approves them."
            />

            <ItemSection
              title="Pending Approval"
              items={pendingItems}
              emoji="⏳"
              emptyMessage="No items pending approval. Your new items will appear here awaiting admin review."
            />

            <ItemSection
              title="Rejected Items"
              items={rejectedItems}
              emoji="❌"
              emptyMessage="No rejected items. Items that don't meet guidelines will appear here."
            />
          </>
        )}
      </div>
    </div>
  );
}

export default MyItems;