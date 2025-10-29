import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaGoogle } from "react-icons/fa";
import "./Login.css";

function Login({ setUser }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ================== AUTO-REDIRECT IF LOGGED IN ==================
  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      const parsedUser = JSON.parse(loggedInUser);
      if (parsedUser.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }
  }, [navigate]);

  // ================== CHECK FOR OAUTH CALLBACK ==================
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
      setMessage(`❌ ${decodeURIComponent(error)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Save token and user
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        
        setMessage("✅ Google login successful! Redirecting...");
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect based on role
        setTimeout(() => {
          setUser(user);
          if (user.role === "admin") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/home", { replace: true });
          }
        }, 1500);
      } catch (err) {
        console.error("Error parsing OAuth response:", err);
        setMessage("❌ Error processing Google login");
        setTimeout(() => setMessage(""), 5000);
      }
    }
  }, [navigate, setUser]);

  // ================== HANDLE INPUT CHANGE ==================
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ================== HANDLE FORM SUBMIT ==================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      setMessage("✅ Login successful! Redirecting...");
      localStorage.setItem("token", data.token);

      setTimeout(() => {
        setUser(data.user);
      }, 1500);

    } catch (err) {
      setMessage(err.message || "❌ Server error. Try again later.");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // ================== HANDLE GOOGLE LOGIN ==================
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setMessage("Redirecting to Google...");
    
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Login to Campus Aggregator</h2>
        {message && (
          <p className={`message ${message.startsWith("✅") ? "success" : "error"}`}>
            {message}
          </p>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="input-group">
            <FaEnvelope className="icon" />
            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading || googleLoading}
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <FaLock className="icon" />
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading || googleLoading}
            />
          </div>

          <button type="submit" disabled={loading || googleLoading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span>OR</span>
        </div>

        {/* Google Login Button */}
        <button 
          type="button" 
          className="google-login-btn"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
        >
          <FaGoogle className="google-icon" />
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        <p className="signup-text">
          Don't have an account?{" "}
          <span onClick={() => navigate("/signup")} className="signup-link">
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;