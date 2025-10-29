import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import './Navbar.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
      fetchUnreadCount();
      
      // Check for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("Error fetching notification count:", err);
    }
  };

  return (
    <nav className="navbar">
      {user ? (
        <>
          <Link to="/">My Home</Link> | 
          <Link to="/add-item">Add Item</Link> | 
          <Link to="/search">Search</Link> | 
          <Link to="/cart">Cart</Link> | 
          <Link to="/requests">Requests</Link> | 
          <Link to="/contact">Contact</Link> | 
          <Link to="/notifications" className="notification-link">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </Link>
        </>
      ) : (
        <>
          <Link to="/">Home</Link> | 
          <Link to="/login">Login</Link> | 
          <Link to="/signup">Signup</Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;