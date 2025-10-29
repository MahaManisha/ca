import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddItem.css"; // Reuse the same CSS

function EditItem() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    yearsUsed: "",
    deliveryOption: "buyer_pickup",
    description: "",
  });

  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchItemDetails();
  }, [itemId]);

  const fetchItemDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      
      if (!token || !storedUser) {
        navigate("/login");
        return;
      }

      const user = JSON.parse(storedUser);
      const response = await fetch(`${API_BASE}/api/items/user/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch item");

      const items = await response.json();
      const item = items.find(i => i._id === itemId);

      if (!item) {
        setError("Item not found");
        setLoading(false);
        return;
      }

      if (item.status !== "pending") {
        setError("Only pending items can be edited");
        setLoading(false);
        return;
      }

      setFormData({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        yearsUsed: item.yearsUsed,
        deliveryOption: item.deliveryOption,
        description: item.description || "",
      });

      setExistingPhotos(item.photos || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      setError("Maximum 3 photos allowed");
      e.target.value = "";
      return;
    }
    setPhotos(files);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      photos.forEach(photo => {
        formDataToSend.append("photos", photo);
      });

      const response = await fetch(`${API_BASE}/api/items/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update item");
      }

      setSuccess("Item updated successfully! Redirecting...");
      setTimeout(() => {
        navigate("/my-items");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="add-item-page">
        <div className="add-item-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading item...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="add-item-page">
        <div className="add-item-container">
          <div className="error-state">
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate("/my-items")} className="back-home-btn">
              ⬅ Back to My Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-item-page">
      <div className="add-item-container">
        <div className="back-home-wrapper">
          <button onClick={() => navigate("/my-items")} className="back-home-btn">
            ⬅ Back
          </button>
        </div>

        <h2>✏️ Edit Item</h2>

        {error && <div className="error">❌ {error}</div>}
        {success && <div className="success">✅ {success}</div>}

        <form onSubmit={handleSubmit}>
          <fieldset disabled={submitting}>
            <div className="form-group">
              <label>Item Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., iPhone 12"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="5000"
                />
              </div>

              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Years Used *</label>
              <input
                type="number"
                name="yearsUsed"
                value={formData.yearsUsed}
                onChange={handleInputChange}
                required
                min="0"
                max="50"
                step="0.1"
                placeholder="2"
              />
              <small>How many years has this item been used?</small>
            </div>

            <div className="form-group">
              <label>Delivery Option *</label>
              <select
                name="deliveryOption"
                value={formData.deliveryOption}
                onChange={handleInputChange}
                required
              >
                <option value="buyer_pickup">🏃 Buyer Pickup</option>
                <option value="seller_delivery">🚚 Seller Delivery</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Additional details about the item..."
                style={{
                  width: "100%",
                  padding: "1rem 1.2rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  color: "#1f2937",
                  background: "#f9fafb",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  resize: "vertical"
                }}
              />
            </div>

            <div className="form-group">
              <label>Update Photos (Max 3)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
              />
              <small>Leave empty to keep existing photos. Upload new photos to replace them.</small>
              
              {existingPhotos.length > 0 && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "#374151", margin: "0 0 0.5rem 0" }}>
                    Current Photos:
                  </p>
                  <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                    {existingPhotos.map((photo, index) => (
                      <img
                        key={index}
                        src={`${API_BASE}/uploads/${photo}`}
                        alt={`Existing ${index + 1}`}
                        style={{ 
                          width: "80px", 
                          height: "80px", 
                          objectFit: "cover", 
                          borderRadius: "8px",
                          border: "2px solid #e5e7eb",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {photos.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "#059669", marginBottom: "0.5rem" }}>
                    ✅ {photos.length} new photo(s) selected
                  </p>
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? "⏳ Updating Item..." : "✅ Update Item"}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}

export default EditItem;