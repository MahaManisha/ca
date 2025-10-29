import React from "react";
import "./ItemCard.css";

function ItemCard({ item, onAddToCart, showInCart = false }) {
  const { _id, name, yearsUsed, price, deliveryOption, seller, photos } = item;
  
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const getItemPhotoUrl = (photos) => {
    if (!photos || photos.length === 0) {
      return "/placeholder-item.png";
    }
    return `${API_BASE}/uploads/${photos[0]}`;
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart({ _id, name, yearsUsed, price, deliveryOption, seller, photos });
    }
  };

  return (
    <div className={`item-card ${showInCart ? 'cart-item-card' : ''}`}>
      <div className="item-card-image-wrapper">
        <img
          src={getItemPhotoUrl(photos)}
          alt={name}
          className="item-card-image"
          onError={(e) => (e.target.src = "/placeholder-item.png")}
        />
      </div>
      
      <div className="item-card-details">
        <h3>{name}</h3>
        <p className="item-price">Price: ₹{price}</p>
        <p>Used: {yearsUsed} year(s)</p>
        <p>
          Delivery:{" "}
          {deliveryOption === "buyer_pickup" ? "🏃 Buyer Pickup" : "🚚 Seller Delivery"}
        </p>
        <p>Seller: {seller?.name || "Unknown"}</p>

        {onAddToCart && (
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

export default ItemCard;