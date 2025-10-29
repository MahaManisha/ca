import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./KnowledgeShare.css";

function KnowledgeShare() {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    isPaid: false,
    price: 0,
    file: null,
    sampleFile: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  // -------------------- Check Profile Completion --------------------
  useEffect(() => {
    const checkProfileCompletion = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!user) {
        setMessage("⚠️ Please login first to share knowledge.");
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
        setMessage(`⚠️ Please complete your profile before sharing knowledge. Missing: ${missing.join(", ")}`);
      } else {
        setProfileIncomplete(false);
        setMissingFields([]);
      }
    };

    checkProfileCompletion();
  }, []);

  // -------------------- Handle Input --------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 500 * 1024 * 1024) {
      setMessage("⚠️ File size should not exceed 500MB");
      e.target.value = null;
      return;
    }
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleSampleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 100 * 1024 * 1024) {
      setMessage("⚠️ Sample file size should not exceed 100MB");
      e.target.value = null;
      return;
    }
    setFormData((prev) => ({ ...prev, sampleFile: file }));
  };

  // -------------------- Handle Submit --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Double-check profile completion before submission
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.name || !user.contact || !user.department || !user.year) {
      setMessage("❌ Please complete your profile before sharing knowledge.");
      return;
    }

    if (!formData.title || !formData.file) {
      setMessage("⚠️ Title and Main File are required!");
      return;
    }

    // Validate price if paid
    if (formData.isPaid && (!formData.price || formData.price <= 0)) {
      setMessage("⚠️ Please set a valid price for paid content!");
      return;
    }

    // Validate sample file for paid content
    if (formData.isPaid && formData.price > 0 && !formData.sampleFile) {
      setMessage("⚠️ Sample file is required for paid content!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("subject", formData.subject);
      data.append("isPaid", formData.isPaid);
      data.append("price", formData.isPaid ? formData.price : 0);
      data.append("file", formData.file);
      
      // Add sample file if it exists
      if (formData.sampleFile) {
        data.append("sampleFile", formData.sampleFile);
      }

      const res = await fetch(`${API_BASE}/api/knowledge/add`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await res.json();

      if (res.ok) {
        setMessage("✅ Note shared successfully!");
        setFormData({
          title: "",
          description: "",
          subject: "",
          isPaid: false,
          price: 0,
          file: null,
          sampleFile: null,
        });
        // Clear file inputs
        const mainFileInput = document.getElementById("mainFile");
        const sampleFileInput = document.getElementById("sampleFile");
        if (mainFileInput) mainFileInput.value = "";
        if (sampleFileInput) sampleFileInput.value = "";
        
        setTimeout(() => navigate("/knowledge-list"), 1500);
      } else {
        setMessage(result.message || "❌ Failed to upload note.");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Server error. Try again later.");
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

  // -------------------- If Profile Incomplete --------------------
  if (profileIncomplete) {
    return (
      <div className="knowledge-share-container">
        <div className="knowledge-share-card profile-warning-card">
          <h1>⚠️ Profile Incomplete</h1>

          <div className="profile-warning">
            <div className="warning-icon">🔒</div>
            <h3>Complete Your Profile First</h3>
            <p>
              You need to complete your profile before you can share knowledge and study materials.
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
              <button className="back-btn" onClick={handleBackToHome}>
                ⬅ Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------- Main Form --------------------
  return (
    <div className="knowledge-share-container">
      <div className="knowledge-share-card">
        <h1>🧠 Share Your Knowledge</h1>
        <p>Upload your study notes or learning materials for others to access.</p>

        <form className="knowledge-form" onSubmit={handleSubmit}>
          <label>Title *</label>
          <input
            type="text"
            name="title"
            placeholder="Enter note title"
            value={formData.title}
            onChange={handleChange}
            disabled={loading}
            required
          />

          <label>Description</label>
          <textarea
            name="description"
            placeholder="Brief overview of your material"
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            rows="4"
          />

          <label>Subject</label>
          <input
            type="text"
            name="subject"
            placeholder="e.g., Data Structures, Machine Learning"
            value={formData.subject}
            onChange={handleChange}
            disabled={loading}
          />

          <div className="paid-checkbox">
            <label>
              <input
                type="checkbox"
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleChange}
                disabled={loading}
              />
              <span>This is paid content</span>
            </label>
          </div>

          {formData.isPaid && (
            <div className="price-input">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                min="1"
                placeholder="Enter price"
                value={formData.price}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          )}

          <label>Upload Main File (Full Content) *</label>
          <input 
            id="mainFile"
            type="file" 
            accept=".pdf,.png,.jpg,.jpeg,.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm" 
            onChange={handleFileChange} 
            disabled={loading}
            required 
          />
          <small>Supported: PDF, Images, Videos (MP4, AVI, MOV, WMV, FLV, MKV, WEBM) - Max 500MB</small>

          {formData.isPaid && formData.price > 0 && (
            <>
              <label className="sample-label">Upload Sample File (Preview) *</label>
              <input 
                id="sampleFile"
                type="file" 
                accept=".pdf,.png,.jpg,.jpeg,.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm" 
                onChange={handleSampleFileChange} 
                disabled={loading}
                required 
              />
              <small className="sample-info">
                📌 <strong>Sample file is required for paid content.</strong><br/>
                For PDFs: Include 1-5 preview pages. For Videos: Include 30s-2min preview clip.<br/>
                Max size: 100MB
              </small>
            </>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Share Note"}
          </button>
        </form>

        {message && (
          <p className={`message ${message.startsWith("✅") ? "success" : "error"}`}>
            {message}
          </p>
        )}

        <button className="back-btn" onClick={handleBackToHome} disabled={loading}>
          ⬅ Back to Home
        </button>
      </div>
    </div>
  );
}

export default KnowledgeShare;