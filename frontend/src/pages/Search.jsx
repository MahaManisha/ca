import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Search.css";

function Search() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState("");

  // Load logged-in user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user._id) setCurrentUser(user);
  }, []);

  // Normalize item IDs for consistency
  const normalizeItems = (data) =>
    data.map((item) => ({
      ...item,
      _id: item._id || item.id,
      photos: item.photos || [],
      seller: item.seller || { name: "Unknown" },
    }));

  // Fetch all items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/items?userId=${currentUser?._id || ""}`
        );
        const data = await res.json();
        console.log("Fetched items:", data); // Debug log
        setItems(normalizeItems(data));
      } catch (err) {
        console.error("Fetch error:", err);
        setMessage("Error fetching items");
      }
    };
    fetchItems();
  }, [currentUser]);

  // Handle search input
  const handleChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedItem(null);

    if (!value.trim()) {
      setFilteredItems([]);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/items/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm: value, userId: currentUser?._id }),
      });
      const data = await res.json();
      console.log("Search results:", data); // Debug log
      setFilteredItems(normalizeItems(data));
    } catch (err) {
      console.error("Search error:", err);
      setFilteredItems([]);
    }
  };

  // Handle Add to Cart logic
  const handleAddToCart = async (item) => {
    if (!currentUser?._id) return alert("Please login first");
    if (!item._id) return alert("Item ID missing");
    if (item.quantity <= 0) return alert("Item out of stock");

    try {
      const res = await fetch("http://localhost:5000/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id, itemId: item._id }),
      });
      
      const data = await res.json();
      console.log("Add to cart response:", data); // Debug log
      
      if (!res.ok) return alert(data.error || "Failed to add item");

      alert("✅ " + (data.message || "Item added to cart"));

      // ✅ Update item quantities across all lists
      const updateQuantity = (list) =>
        list.map((i) =>
          i._id === item._id
            ? { ...i, quantity: Math.max(i.quantity - 1, 0) }
            : i
        );

      setItems(updateQuantity(items));
      setFilteredItems(updateQuantity(filteredItems));

      if (selectedItem?._id === item._id) {
        setSelectedItem({
          ...selectedItem,
          quantity: Math.max(selectedItem.quantity - 1, 0),
        });
      }
    } catch (err) {
      console.error("Cart error:", err);
      alert("Server error while adding to cart");
    }
  };

  const handleBackToHome = () => navigate("/home");

  // Get image URL with fallback
  const getImageUrl = (photos) => {
    if (photos && photos.length > 0) {
      return `http://localhost:5000/uploads/${photos[0]}`;
    }
    return "https://via.placeholder.com/200x200?text=No+Image";
  };

  // Determine which list to show
  const displayItems = searchTerm.trim().length > 0 ? filteredItems : items;

  return (
    <div className="search-container">
      <h2>🔍 Browse Items</h2>
      {message && <p className="error">{message}</p>}

      {/* Back Button */}
      <div className="back-home-wrapper">
        <button className="back-home-btn" onClick={handleBackToHome}>
          ⬅ Back to Home
        </button>
      </div>

      {/* Search Input */}
      <input
        type="text"
        className="search-input"
        placeholder="Search for an item..."
        value={searchTerm}
        onChange={handleChange}
      />

      {/* Search Suggestions */}
      {filteredItems.length > 0 && !selectedItem && (
        <ul className="suggestions">
          {filteredItems.map((item) => (
            <li
              key={item._id}
              onClick={() => setSelectedItem(item)}
              className="suggestion-item"
            >
              <img
                src={getImageUrl(item.photos)}
                alt={item.name}
                className="suggestion-img"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/50x50?text=No+Image";
                }}
              />
              <div>
                <div>{item.name} - ₹{item.price}</div>
                <small style={{ color: "#666", fontSize: "0.85em" }}>
                  Seller: {item.seller?.name || "Unknown"} • {item.quantity} available
                </small>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Selected Item */}
      {selectedItem && (
        <div className="item-details">
          <h3>{selectedItem.name}</h3>
          <img
            src={getImageUrl(selectedItem.photos)}
            alt={selectedItem.name}
            className="item-img"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x400?text=No+Image";
            }}
          />
          <div className="thumbnails">
            {selectedItem.photos.map((photo, idx) => (
              <img
                key={idx}
                src={`http://localhost:5000/uploads/${photo}`}
                alt={`${selectedItem.name} view ${idx + 1}`}
                className="thumbnail-img"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/80x80?text=No+Image";
                }}
              />
            ))}
          </div>

          <p>
            <strong>Price:</strong> ₹{selectedItem.price}
          </p>
          <p>
            <strong>Quantity:</strong> {selectedItem.quantity}
          </p>
          <p>
            <strong>Seller:</strong> {selectedItem.seller?.name || "Unknown"}
          </p>
          <p>
            <strong>Delivery:</strong>{" "}
            {selectedItem.deliveryOption === "buyer_pickup"
              ? "Buyer Pickup"
              : "Seller Delivery"}
          </p>
          <p>
            <strong>Years Used:</strong> {selectedItem.yearsUsed}
          </p>

          <button
            onClick={() => handleAddToCart(selectedItem)}
            disabled={selectedItem.quantity <= 0}
          >
            {selectedItem.quantity > 0
              ? "➕ Add to Cart"
              : "❌ Out of stock"}
          </button>
        </div>
      )}

      {/* All Items Grid */}
      <div className="items-grid">
        {displayItems.length === 0 ? (
          <p className="no-items">No items found.</p>
        ) : (
          displayItems.map((item) => (
            <div key={item._id} className="item-card">
              <img
                src={getImageUrl(item.photos)}
                alt={item.name}
                className="item-img"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/280x200?text=No+Image";
                }}
              />
              <div className="thumbnails">
                {item.photos.slice(0, 3).map((photo, idx) => (
                  <img
                    key={idx}
                    src={`http://localhost:5000/uploads/${photo}`}
                    alt={`${item.name} view ${idx + 1}`}
                    className="thumbnail-img"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/80x80?text=No+Image";
                    }}
                  />
                ))}
              </div>

              <h3>{item.name}</h3>
              <p>₹{item.price}</p>
              <p>Qty: {item.quantity}</p>
              <p style={{ fontSize: "0.9em", color: "#5a4a3a" }}>
                <strong>Seller:</strong> {item.seller?.name || "Unknown"}
              </p>
              <p>
                {item.deliveryOption === "buyer_pickup"
                  ? "Buyer Pickup"
                  : "Seller Delivery"}
              </p>

              <button
                onClick={() => handleAddToCart(item)}
                disabled={item.quantity <= 0}
              >
                {item.quantity > 0
                  ? "➕ Add to Cart"
                  : "❌ Out of stock"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Search;