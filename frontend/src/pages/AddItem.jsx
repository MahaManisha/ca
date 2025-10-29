import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AddItem.css";

function AddItem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    years: "",
    months: "",
    price: "",
    quantity: 1,
    deliveryOption: "buyer_pickup",
    photos: [],
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  // Check if profile is complete on component mount
  useEffect(() => {
    const checkProfileCompletion = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!user) {
        setMessage({
          text: "Please login first to add an item.",
          type: "error",
        });
        setProfileIncomplete(true);
        return;
      }

      // Check for required profile fields
      const requiredFields = {
        name: "Name",
        contact: "Contact",
        department: "Department",
        year: "Year"
      };

      const missing = [];

      Object.keys(requiredFields).forEach(field => {
        const value = user[field];
        if (!value || value.toString().trim() === "") {
          missing.push(requiredFields[field]);
        }
      });

      if (missing.length > 0) {
        setProfileIncomplete(true);
        setMissingFields(missing);
        setMessage({
          text: `Please complete your profile before adding items. Missing: ${missing.join(", ")}`,
          type: "error",
        });
      } else {
        setProfileIncomplete(false);
        setMissingFields([]);
      }
    };

    checkProfileCompletion();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photos") {
      setFormData((prev) => ({ ...prev, photos: files }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    // Double-check profile completion before submission
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.name || !user.contact || !user.department || !user.year) {
      setMessage({
        text: "❌ Please complete your profile before adding items.",
        type: "error",
      });
      return;
    }

    const totalYearsUsed =
      Number(formData.years || 0) + Number(formData.months || 0) / 12;

    if (
      !formData.name.trim() ||
      totalYearsUsed < 0 ||
      Number(formData.price) < 0 ||
      Number(formData.quantity) < 1
    ) {
      setMessage({ text: "Please fill all fields correctly.", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("yearsUsed", totalYearsUsed);
      payload.append("price", Number(formData.price));
      payload.append("quantity", Number(formData.quantity));
      payload.append("deliveryOption", formData.deliveryOption);
      payload.append("seller", user._id);

      if (formData.photos.length > 0) {
        Array.from(formData.photos).forEach((file) => {
          payload.append("photos", file);
        });
      }

      const response = await fetch("http://localhost:5000/api/items", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unknown error");

      setMessage({ text: "✅ Item added successfully!", type: "success" });
      setFormData({
        name: "",
        years: "",
        months: "",
        price: "",
        quantity: 1,
        deliveryOption: "buyer_pickup",
        photos: [],
      });

      document.getElementById("photos").value = "";

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      console.error("Add item error:", err);
      setMessage({ text: `❌ ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/home");
  };

  const handleGoToProfile = () => {
    navigate("/home", { state: { view: "profile" } });
  };

  // If profile is incomplete, show warning message
  if (profileIncomplete) {
    return (
      <div className="add-item-page">
        <div className="add-item-container">
          <h2>⚠️ Profile Incomplete</h2>

          <div className="profile-warning">
            <div className="warning-icon">🔒</div>
            <h3>Complete Your Profile First</h3>
            <p>
              You need to complete your profile before you can add items to the marketplace.
            </p>
            
            <div className="missing-fields">
              <h4>Missing Information:</h4>
              <ul>
                {missingFields.map((field, index) => (
                  <li key={index}>❌ {field}</li>
                ))}
              </ul>
            </div>

            <div className="warning-actions">
              <button className="complete-profile-btn" onClick={handleGoToProfile}>
                📝 Complete Profile
              </button>
              <button className="back-home-btn" onClick={handleBackToHome}>
                ⬅ Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-item-page">
      <div className="add-item-container">
        <h2>Add New Item</h2>

        <div className="back-home-wrapper">
          <button className="back-home-btn" onClick={handleBackToHome}>
            ⬅ Back to Home
          </button>
        </div>

        {message.text && (
          <p className={message.type === "success" ? "success" : "error"}>
            {message.text}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset disabled={loading}>
            <div className="form-group">
              <label htmlFor="name">Item Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="e.g., Calculator, Book"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Years Used</label>
              <div className="years-months-input">
                <input
                  type="number"
                  name="years"
                  placeholder="Years"
                  min="0"
                  value={formData.years}
                  onChange={handleChange}
                />
                <span>years</span>
                <input
                  type="number"
                  name="months"
                  placeholder="Months"
                  min="0"
                  max="11"
                  value={formData.months}
                  onChange={handleChange}
                />
                <span>months</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="price">Expected Price (₹)</label>
              <input
                type="number"
                id="price"
                name="price"
                placeholder="e.g., 500"
                min="0"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                placeholder="e.g., 1"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="deliveryOption">Delivery Option</label>
              <select
                id="deliveryOption"
                name="deliveryOption"
                value={formData.deliveryOption}
                onChange={handleChange}
                required
              >
                <option value="buyer_pickup">Buyer needs to come to buy</option>
                <option value="seller_delivery">Seller will deliver</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="photos">Upload Photos</label>
              <input
                type="file"
                id="photos"
                name="photos"
                accept="image/*"
                multiple
                onChange={handleChange}
              />
              <small>You can upload up to 3 images (JPEG/PNG, max 2MB each)</small>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "⏳ Adding..." : "➕ Add Item"}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}

export default AddItem;