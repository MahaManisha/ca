import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import "./Signup.css";

function Signup({ setUser }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ---------------- Input Change ----------------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  // ---------------- Form Submit ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { username, email, password } = formData;

    // ---- Frontend Validation ----
    if (!username || !email || !password) {
      setMessage("❌ All fields are required.");
      return;
    }
    if (!email.endsWith("@nec.edu.in")) {
      setMessage("❌ Please use a valid @nec.edu.in email address.");
      return;
    }
    if (password.length < 6) {
      setMessage("❌ Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Account created successfully! Redirecting to login...");
        setFormData({ username: "", email: "", password: "" });
        setTimeout(() => navigate("/login"), 1500);
      } else {
        const errorMsg = data.message || data.error || "Error creating account";
        setMessage(`❌ ${errorMsg}`);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setMessage("❌ Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Google Signup ----------------
  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Create Account</h2>

        {message && (
          <p className={`message ${message.startsWith("✅") ? "success" : "error"}`}>
            {message}
          </p>
        )}

        {/* Google Signup */}
        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          <FcGoogle className="google-icon" />
          Continue with Google
        </button>

        <div className="divider"><span>OR</span></div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="input-group">
            <FaUser className="icon" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="input-group">
            <FaEnvelope className="icon" />
            <input
              type="email"
              name="email"
              placeholder="Email (@nec.edu.in)"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <FaLock className="icon" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? "Creating..." : "Signup"}
          </button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
