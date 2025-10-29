import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./KnowledgeList.css";

const KnowledgeList = ({ user }) => {
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadingSampleId, setDownloadingSampleId] = useState(null);
  const navigate = useNavigate();
  const API_BASE = "http://localhost:5000";

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/knowledge`);
      const data = await res.json();
      setKnowledgeList(data);
    } catch (error) {
      console.error("Error fetching knowledge:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to download main file
  const downloadFile = async (item) => {
    setDownloadingId(item._id);
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${API_BASE}/api/knowledge/download/${item._id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.message || "Failed to download file");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const fileExtension = item.fileUrl ? item.fileUrl.split('.').pop() : 'pdf';
      a.download = `${item.title}.${fileExtension}`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert("✅ Download started successfully!");
    } catch (error) {
      console.error("Download error:", error);
      alert("Error downloading file. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Function to download sample file (no authentication required)
  const downloadSample = async (item) => {
    setDownloadingSampleId(item._id);
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/sample/${item._id}`, {
        method: "GET",
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.message || "Sample file not available");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const fileExtension = item.sampleFileUrl ? item.sampleFileUrl.split('.').pop() : 'pdf';
      a.download = `SAMPLE-${item.title}.${fileExtension}`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert("✅ Sample downloaded successfully!");
    } catch (error) {
      console.error("Sample download error:", error);
      alert("Error downloading sample. Please try again.");
    } finally {
      setDownloadingSampleId(null);
    }
  };

  const handleViewDownload = async (item) => {
    if (!user) {
      alert("Please login first to access this content.");
      navigate("/login");
      return;
    }

    // If it's free content, download directly
    if (!item.isPaid || item.price === 0) {
      downloadFile(item);
      return;
    }

    // If it's paid content, check purchase status
    try {
      const token = localStorage.getItem("token");
      const checkRes = await fetch(
        `${API_BASE}/api/purchases/check/${item._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const checkData = await checkRes.json();
      
      if (checkData.purchased) {
        // User has purchased, allow download
        downloadFile(item);
      } else {
        // User hasn't purchased, show payment option
        const proceed = window.confirm(
          `This content costs ₹${item.price}. Would you like to add it to cart and proceed to payment?`
        );
        if (proceed) {
          await handleAddToCart(item);
          navigate("/cart");
        }
      }
    } catch (error) {
      console.error("Error checking purchase status:", error);
      alert("Unable to verify purchase status. Please try again.");
    }
  };

  const handleAddToCart = async (item) => {
    if (!user) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: item._id }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Added to cart successfully!");
        return true;
      } else {
        alert(data.message || "Failed to add to cart.");
        return false;
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Error adding to cart. Please try again.");
      return false;
    }
  };

  if (loading) {
    return (
      <div className="knowledge-loading">
        <div className="spinner"></div>
        <p>Loading knowledge base...</p>
      </div>
    );
  }

  return (
    <div className="knowledge-list-container">
      <div className="knowledge-header">
        <h1 className="knowledge-title">📚 Shared Knowledge</h1>
        <p className="knowledge-subtitle">
          Discover and download study materials shared by your peers
        </p>
      </div>

      <div className="knowledge-grid">
        {knowledgeList.length === 0 ? (
          <div className="no-knowledge">
            <div className="empty-icon">📭</div>
            <h3>No shared notes found</h3>
            <p>Be the first to share your knowledge!</p>
            <button 
              className="share-btn"
              onClick={() => navigate("/knowledge-share")}
            >
              Share Knowledge
            </button>
          </div>
        ) : (
          knowledgeList.map((item) => (
            <div key={item._id} className="knowledge-card">
              <div className="card-header">
                <h3>{item.title}</h3>
                <span className={`badge ${item.isPaid && item.price > 0 ? "paid" : "free"}`}>
                  {item.isPaid && item.price > 0 ? `₹${item.price}` : "Free"}
                </span>
              </div>

              {item.description && (
                <p className="desc">{item.description}</p>
              )}

              {item.subject && (
                <div className="subject-tag">
                  <span>📖 {item.subject}</span>
                </div>
              )}

              <div className="card-footer">
                <p className="author">
                  👤 {item.uploadedBy?.name || item.uploadedBy?.username || "Unknown"}
                </p>
                {item.createdAt && (
                  <p className="upload-date">
                    📅 {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="card-actions">
                {/* Show sample download button for paid content */}
                {item.isPaid && item.price > 0 && item.sampleFileUrl && (
                  <button
                    className="sample-btn"
                    onClick={() => downloadSample(item)}
                    disabled={downloadingSampleId === item._id}
                  >
                    {downloadingSampleId === item._id ? (
                      <>⏳ Downloading...</>
                    ) : (
                      <>🎁 Preview Sample</>
                    )}
                  </button>
                )}

                <button
                  className="view-download-btn"
                  onClick={() => handleViewDownload(item)}
                  disabled={downloadingId === item._id}
                >
                  {downloadingId === item._id ? (
                    <>⏳ Downloading...</>
                  ) : item.isPaid && item.price > 0 ? (
                    <>🔒 Download Full Content</>
                  ) : (
                    <>📥 Download</>
                  )}
                </button>
                
                {item.isPaid && item.price > 0 && (
                  <button
                    className="cart-btn"
                    onClick={() => handleAddToCart(item)}
                    disabled={downloadingId === item._id}
                  >
                    🛒 Add to Cart
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="action-buttons">
        <button 
          className="back-home-btn"
          onClick={() => navigate("/home")}
        >
          ⬅ Back to Home
        </button>
        <button 
          className="share-knowledge-btn"
          onClick={() => navigate("/knowledge-share")}
        >
          ➕ Share Your Knowledge
        </button>
      </div>
    </div>
  );
};

export default KnowledgeList;