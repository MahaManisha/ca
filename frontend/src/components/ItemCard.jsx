import React from "react";
import './ItemCard.css';
function ItemCard({ item }) {
  return (
    <div style={{ border: "1px solid #ccc", margin: "10px", padding: "15px", borderRadius: "8px" }}>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <p>
        <strong>Available:</strong> {item.available ? "Yes" : "No"}
      </p>
      <p>
        <strong>Owner:</strong> {item.owner} ({item.contact})
      </p>
      <button>Request</button>
    </div>
  );
}

export default ItemCard;
