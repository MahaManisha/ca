import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const navigate = useNavigate();

  const API_BASE = "http://localhost:5000";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?._id) {
      setCurrentUser(user);
      fetchCart(user._id);
    } else setLoading(false);
  }, []);

  // ✅ Helper function to get seller photo URL
  const getSellerPhotoUrl = (seller) => {
    if (!seller || !seller.photo || seller.photo.trim() === "") {
      return "/default-avatar.png";
    }
    return `${API_BASE}/uploads/profiles/${seller.photo}`;
  };

  // ✅ Helper function to get item image URL
  const getItemImageUrl = (photos) => {
    if (photos && photos.length > 0) {
      return `${API_BASE}/uploads/${photos[0]}`;
    }
    return "https://via.placeholder.com/200x200?text=No+Image";
  };

  const fetchCart = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/cart/${userId}`);
      const data = await res.json();
      console.log("Cart data:", data); // Debug log
      setCartItems(data.items || []);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE}/api/cart/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id, itemId }),
      });
      if (res.ok) {
        setCartItems((prev) => prev.filter((item) => item.itemId !== itemId));
        alert("✅ Item removed and availability restored");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove item");
      }
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  const handleBuyNow = () => {
    if (cartItems.length === 0) return alert("Cart is empty");
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = () => {
    if (!selectedPaymentMethod) return alert("Select a payment method");

    if (selectedPaymentMethod === "cash_on_delivery") {
      // COD flow
      fetch(`${API_BASE}/api/cart/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id, paymentMethod: "cash_on_delivery" }),
      })
        .then(res => res.ok ? res.json() : res.json().then(data => Promise.reject(data)))
        .then(() => {
          setCartItems([]);
          setShowPaymentModal(false);
          navigate("/payment-success");
        })
        .catch(err => alert(err.error || "Payment failed"));
    } else if (selectedPaymentMethod === "online_payment") {
      // Navigate to PaymentPage with state
      const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      navigate("/payment", { state: { amount: totalAmount, cartItems, user: currentUser } });
    }
  };

  if (loading) return (
    <div className="mycart-container">
      <p className="loading-text">Loading your cart...</p>
    </div>
  );
  if (!currentUser) return (
    <div className="mycart-container">
      <p className="empty-text">Please login to view your cart.</p>
    </div>
  );
  if (cartItems.length === 0) return (
    <div className="mycart-container">
      <h2>🛒 My Cart</h2>
      <div className="empty-cart-state">
        <div className="empty-cart-icon">🛒</div>
        <p className="empty-cart-message">Your cart is empty</p>
        <p className="empty-cart-subtitle">Add items to get started!</p>
        <button className="browse-items-btn" onClick={() => navigate("/home")}>
          Browse Items
        </button>
      </div>
    </div>
  );

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="mycart-container">
      <h2>🛒 My Cart</h2>
      
      <ul className="cart-list">
        {cartItems.map((item) => (
          <li key={item.itemId}>
            {/* ✅ Item Image Section */}
            <div className="cart-item-image">
              <img
                src={getItemImageUrl(item.photos)}
                alt={item.name}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/200x200?text=No+Image";
                }}
              />
            </div>

            {/* ✅ Item Details Section */}
            <div className="cart-item-details">
              <div className="cart-item-header">
                <h3>{item.name}</h3>
                <div className="price-badge">₹{item.price}</div>
              </div>

              {/* ✅ Seller Info with Photo */}
              <div className="seller-info-section" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                marginBottom: '16px',
                padding: '10px',
                background: 'var(--bg-light)',
                borderRadius: '8px'
              }}>
                <img
                  src={getSellerPhotoUrl(item.seller)}
                  alt={item.seller?.name || 'Seller'}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--primary)'
                  }}
                  onError={(e) => (e.target.src = "/default-avatar.png")}
                />
                <div>
                  <strong style={{ fontSize: '0.95em', color: 'var(--text-dark)' }}>
                    {item.seller?.name || "Unknown Seller"}
                  </strong>
                  <p style={{ fontSize: '0.8em', color: 'var(--text-light)', margin: '2px 0 0 0' }}>
                    {item.seller?.department ? `${item.seller.department} • Year ${item.seller.year}` : 'Seller'}
                  </p>
                </div>
              </div>

              <div className="cart-item-info">
                <div className="info-item">
                  <span className="info-label">Years Used:</span>
                  <span className="info-value">{item.yearsUsed}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Quantity:</span>
                  <span className="info-value">{item.quantity}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Delivery:</span>
                  <span className="info-value">
                    {item.deliveryOption === "buyer_pickup" ? "🏃 Buyer Pickup" : "🚚 Seller Delivery"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Subtotal:</span>
                  <span className="info-value" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              </div>

              <div className="item-actions">
                <button className="remove-btn" onClick={() => removeFromCart(item.itemId)}>
                  ❌ Remove from Cart
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="checkout-section">
        <h3>Total: ₹{totalAmount}</h3>
        <p className="item-count">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in cart</p>
        <button className="pay-btn" onClick={handleBuyNow}>💳 Proceed to Pay</button>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Select Payment Method</h2>
            <div className="payment-options">
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="cash_on_delivery"
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                />
                <span>💵 Cash on Delivery</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="online_payment"
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                />
                <span>💳 Online Payment</span>
              </label>
            </div>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={handlePaymentConfirm}>Confirm Payment</button>
              <button className="cancel-btn" onClick={() => setShowPaymentModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;