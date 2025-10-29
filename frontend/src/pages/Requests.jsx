import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Requests.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Requests({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser || null);
  const [allRequests, setAllRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({ title: "", description: "" });
  const [replyMessage, setReplyMessage] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  // ✅ Load user from localStorage if not passed as prop
  useEffect(() => {
    try {
      if (!user) {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        
        if (!storedUser || !storedToken) {
          navigate("/login");
          return;
        }
        
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("User loaded from localStorage:", parsedUser);
      }
    } catch (err) {
      console.error("Error loading user:", err);
      navigate("/login");
    }
  }, [propUser, navigate]);

  // ✅ Fetch requests only when user is loaded
  useEffect(() => {
    if (user && token) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching requests...");
      
      const resAll = await axios.get(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("All requests:", resAll.data);
      setAllRequests(resAll.data || []);

      const resMine = await axios.get(`${API_BASE}/requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("My requests:", resMine.data);
      setMyRequests(resMine.data || []);
    } catch (err) {
      console.error("Fetch requests error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to load requests";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      alert("Please fill in both title and description");
      return;
    }

    try {
      console.log("Submitting request:", newRequest);
      
      await axios.post(`${API_BASE}/requests`, newRequest, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setNewRequest({ title: "", description: "" });
      fetchRequests();
      alert("Request posted successfully!");
    } catch (err) {
      console.error("Submit request error:", err);
      alert(err.response?.data?.message || "Failed to post request");
    }
  };

  const handleReply = async (requestId) => {
    const message = replyMessage[requestId];
    
    if (!message || !message.trim()) {
      alert("Please enter a reply message");
      return;
    }

    try {
      console.log("Sending reply to request:", requestId, "Message:", message);
      
      await axios.post(
        `${API_BASE}/requests/${requestId}/reply`,
        { message: message.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReplyMessage({ ...replyMessage, [requestId]: "" });
      fetchRequests();
      alert("Reply sent successfully!");
    } catch (err) {
      console.error("Reply error:", err);
      alert(err.response?.data?.message || "Failed to send reply");
    }
  };

  const handleReplyChange = (requestId, value) => {
    setReplyMessage({
      ...replyMessage,
      [requestId]: value
    });
  };

  // ✅ Show loading state
  if (loading && !user) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading requests...</p>
        </div>
      </div>
    );
  }

  // ✅ Show error if user not found
  if (!user) {
    return (
      <div className="page-container">
        <div className="error-state">
          <h2>Authentication Required</h2>
          <p>Please login to view requests</p>
          <button className="back-btn" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate("/home")}>
          ← Back to Home
        </button>
        <h2>Buyer Requests</h2>
        <div style={{ width: '140px' }}></div>
      </div>

      {/* New Request Form */}
      <div className="new-request-section">
        <h3>📝 Post a New Request</h3>
        <form onSubmit={handleRequestSubmit} className="new-request-form">
          <input
            type="text"
            placeholder="Request Title (e.g., Looking for C Programming Textbook)"
            value={newRequest.title}
            onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
            required
            maxLength={100}
          />
          <textarea
            placeholder="Request Description (Provide details about what you're looking for)"
            value={newRequest.description}
            onChange={(e) =>
              setNewRequest({ ...newRequest, description: e.target.value })
            }
            required
            rows={4}
            maxLength={500}
          />
          <button type="submit" className="submit-request-btn">
            📤 Post Request
          </button>
        </form>
      </div>

      <hr className="section-divider" />

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={fetchRequests} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      )}

      {/* All Requests */}
      <div className="requests-section">
        <h3>📋 All Requests</h3>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : allRequests.length === 0 ? (
          <div className="empty-state">
            <p>📭 No requests yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="requests-list">
            {allRequests.map((req) => (
              <div key={req._id} className="request-card">
                <div className="request-header">
                  <h4>{req.title}</h4>
                  <span className="request-date">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="request-description">{req.description}</p>
                <div className="request-footer">
                  <p className="requester-info">
                    <strong>Posted by:</strong> {req.requester?.name || "Unknown"} 
                    ({req.requester?.email || "N/A"})
                  </p>
                </div>

                {/* Only show reply input for non-requester */}
                {user._id !== req.requester?._id && (
                  <div className="reply-section">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyMessage[req._id] || ""}
                      onChange={(e) => handleReplyChange(req._id, e.target.value)}
                      maxLength={200}
                    />
                    <button 
                      onClick={() => handleReply(req._id)}
                      disabled={!replyMessage[req._id]?.trim()}
                      className="reply-btn"
                    >
                      💬 Reply
                    </button>
                  </div>
                )}

                {/* Display replies if you are the requester */}
                {user._id === req.requester?._id && req.replies && req.replies.length > 0 && (
                  <div className="replies">
                    <h5>💬 Replies ({req.replies.length}):</h5>
                    {req.replies.map((r) => (
                      <div key={r._id} className="reply-item">
                        <p>
                          <strong>{r.responder?.name || "Unknown"}:</strong> {r.message}
                        </p>
                        <span className="reply-date">
                          {new Date(r.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="section-divider" />

      {/* My Requests */}
      <div className="requests-section">
        <h3>📌 My Requests</h3>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your requests...</p>
          </div>
        ) : myRequests.length === 0 ? (
          <div className="empty-state">
            <p>📭 You haven't posted any requests yet.</p>
            <p className="empty-state-hint">Create a request above to get started!</p>
          </div>
        ) : (
          <div className="requests-list">
            {myRequests.map((req) => (
              <div key={req._id} className="request-card my-request">
                <div className="request-header">
                  <h4>{req.title}</h4>
                  <span className="request-date">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="request-description">{req.description}</p>
                
                {req.replies && req.replies.length > 0 ? (
                  <div className="replies">
                    <h5>💬 Replies ({req.replies.length}):</h5>
                    {req.replies.map((r) => (
                      <div key={r._id} className="reply-item">
                        <p>
                          <strong>{r.responder?.name || "Unknown"}:</strong> {r.message}
                        </p>
                        <span className="reply-date">
                          {new Date(r.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-replies">No replies yet</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}