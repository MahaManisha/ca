// frontend/src/pages/Home.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home({ user: initialUser, setUser: setGlobalUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser || null);
  const [view, setView] = useState("home");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    department: "",
    year: ""
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Products states
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productsLoading, setProductsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Hi! 👋 I'm your Campus Aggregator assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Chatbot quick replies
  const quickReplies = [
    { id: 1, text: "How to add item?", icon: "➕" },
    { id: 2, text: "How to buy items?", icon: "🛒" },
    { id: 3, text: "Share study notes", icon: "📚" },
    { id: 4, text: "Contact support", icon: "💬" }
  ];

  // -------------------- Chatbot Functions --------------------
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (isChatOpen && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isChatOpen]);

  const getBotResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.includes('add') || lowerMsg.includes('sell') || lowerMsg.includes('list')) {
      return {
        text: "To add an item:\n\n1. Click on '➕ Add Item' in the sidebar\n2. Fill in item details (name, price, photos)\n3. Set delivery option (pickup or delivery)\n4. Submit your listing\n\nYour item will appear in the feed for others to see! 📦",
        suggestions: ["How to buy items?", "Delivery options"]
      };
    }

    if (lowerMsg.includes('buy') || lowerMsg.includes('cart') || lowerMsg.includes('purchase') || lowerMsg.includes('pay')) {
      return {
        text: "To buy items:\n\n1. Browse the feed and find items you need\n2. Click '🛒 Add to Cart' or '💳 Pay Now' on any item\n3. Go to 'My Cart' from the sidebar or proceed to payment\n4. Complete your purchase securely\n\nEasy and secure! 🎉",
        suggestions: ["Contact seller", "View my cart"]
      };
    }

    if (lowerMsg.includes('note') || lowerMsg.includes('study') || lowerMsg.includes('knowledge') || lowerMsg.includes('share')) {
      return {
        text: "Knowledge Sharing:\n\n📝 Upload Notes: Click 'Knowledge Share' to upload study materials, notes, and resources\n\n📚 Explore Notes: Click 'Explore Notes' to browse and download materials shared by others\n\nHelp your campus community succeed! 🎓",
        suggestions: ["Upload notes", "Browse notes"]
      };
    }

    if (lowerMsg.includes('profile') || lowerMsg.includes('edit') || lowerMsg.includes('update')) {
      return {
        text: "To update your profile:\n\n1. Click on your profile picture or 'My Profile'\n2. Click '✏️ Edit Profile'\n3. Update your details and photo\n4. Save changes\n\nKeep your profile updated for better connections! 👤",
        suggestions: ["View profile", "Change photo"]
      };
    }

    if (lowerMsg.includes('notification') || lowerMsg.includes('alert')) {
      return {
        text: "Stay updated with notifications! 🔔\n\nYou'll receive alerts for:\n• New buyer requests\n• Messages from buyers/sellers\n• Item updates\n• System announcements\n\nClick the bell icon to view all notifications.",
        suggestions: ["Check notifications", "Mark as read"]
      };
    }

    if (lowerMsg.includes('request') || lowerMsg.includes('buyer')) {
      return {
        text: "Managing Buyer Requests:\n\n1. Go to '📩 Buyer Requests' in sidebar\n2. View all requests for your items\n3. Accept or reject requests\n4. Contact buyers directly\n\nStay on top of your sales! 💼",
        suggestions: ["View requests", "Contact buyer"]
      };
    }

    if (lowerMsg.includes('contact') || lowerMsg.includes('support') || lowerMsg.includes('help') || lowerMsg.includes('issue')) {
      return {
        text: "Need help? We're here! 💬\n\n📧 Email: campusaggregator.app@gmail.com\n📞 Phone: +91 94867 42400\n📍 Location: NEC, Kovilpatti\n\nOr click 'Contact Seller' to reach out to item sellers directly.",
        suggestions: ["Email support", "View contact page"]
      };
    }

    if (lowerMsg.includes('delivery') || lowerMsg.includes('pickup') || lowerMsg.includes('shipping')) {
      return {
        text: "Delivery Options:\n\n🚚 Seller Delivery: Seller brings item to you\n🏃 Buyer Pickup: You collect from seller\n\nChoose what works best when listing items. Coordinate with buyers/sellers for smooth transactions! 📦",
        suggestions: ["How to add item?", "Safety tips"]
      };
    }

    if (lowerMsg.includes('safe') || lowerMsg.includes('secure') || lowerMsg.includes('trust')) {
      return {
        text: "Your Safety Matters! 🔒\n\n✓ Verified college students only\n✓ Direct communication\n✓ Meet in public campus areas\n✓ Inspect items before paying\n✓ Report any suspicious activity\n\nTrust your campus community! 👥",
        suggestions: ["Report issue", "Safety guidelines"]
      };
    }

    if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('fee')) {
      return {
        text: "Pricing on Campus Aggregator:\n\n✓ Free to list items\n✓ Free to browse\n✓ No commission fees\n✓ Set your own prices\n\nKeep 100% of your earnings! 💰",
        suggestions: ["List an item", "Browse items"]
      };
    }

    if (lowerMsg.includes('search') || lowerMsg.includes('find')) {
      return {
        text: "Finding Items:\n\n🔍 Use the search bar on the home feed\n• Search by item name\n• Filter by delivery option\n• Browse through the feed\n\nFind exactly what you need quickly! 🎯",
        suggestions: ["Popular items", "How to buy?"]
      };
    }

    if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
      return {
        text: "Hello! 👋 Welcome to Campus Aggregator!\n\nI can help you with:\n• Buying & selling items\n• Sharing study materials\n• Managing your profile\n• And much more!\n\nWhat would you like to know?",
        suggestions: quickReplies.map(q => q.text)
      };
    }

    if (lowerMsg.includes('thank') || lowerMsg.includes('thanks')) {
      return {
        text: "You're welcome! 😊 Happy to help!\n\nIs there anything else you'd like to know about Campus Aggregator?",
        suggestions: ["How to add item?", "Contact support"]
      };
    }

    return {
      text: "I'm here to help! 🤖\n\nI can assist you with:\n• Adding and selling items\n• Buying from the feed\n• Knowledge sharing\n• Profile management\n• Buyer requests\n• Contact and support\n\nWhat would you like to know more about?",
      suggestions: quickReplies.map(q => q.text)
    };
  };

  const handleSendMessage = (text = chatInput) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const response = getBotResponse(text);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: response.suggestions
      };
      setChatMessages(prev => [...prev, botMessage]);
    }, 800 + Math.random() * 400);
  };

  const handleQuickReply = (text) => {
    handleSendMessage(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // -------------------- Initialize user --------------------
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== "admin") {
          setUser(parsedUser);
          setFormData({
            name: parsedUser.name || "",
            contact: parsedUser.contact || "",
            department: parsedUser.department || "",
            year: parsedUser.year || ""
          });
        }
      }
    } catch (err) {
      console.error("Error reading user from localStorage", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------- Fetch Products --------------------
  useEffect(() => {
    if (user && view === "home") {
      fetchItems();
    }
  }, [user, view]);

  const fetchItems = async () => {
    try {
      setProductsLoading(true);
      const response = await fetch(`${API_BASE}/api/items?userId=${user._id}`);
      const data = await response.json();
      setItems(data || []);
      setFilteredItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  // -------------------- Search Handler --------------------
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term === "") {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.deliveryOption.toLowerCase().includes(term)
      );
      setFilteredItems(filtered);
    }
  };

  // -------------------- Add to Cart Handler --------------------
  const handleAddToCart = async (itemId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id,
          itemId: itemId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Item added to cart successfully!");
        fetchItems();
      } else {
        alert(data.error || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart");
    }
  };

  // -------------------- Pay Now Handler --------------------
  const handlePayNow = (item) => {
    if (!item.available || item.quantity === 0) {
      alert("This item is out of stock");
      return;
    }

    navigate("/payment", {
      state: {
        amount: item.price,
        itemId: item._id,
        itemName: item.name,
        itemPhoto: item.photos && item.photos.length > 0 ? item.photos[0] : null,
        sellerName: item.seller?.name || "Unknown Seller",
        quantity: 1
      }
    });
  };

  // -------------------- Fetch Notifications --------------------
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // -------------------- Sync with initialUser prop --------------------
  useEffect(() => {
    if (initialUser && initialUser.role !== "admin") {
      setUser(initialUser);
      setFormData({
        name: initialUser.name || "",
        contact: initialUser.contact || "",
        department: initialUser.department || "",
        year: initialUser.year || ""
      });
    }
  }, [initialUser]);

  // -------------------- Logout --------------------
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setGlobalUser(null);
    setView("home");
    navigate("/home", { replace: true });
  };

  // -------------------- Profile Photo --------------------
  const getPhotoUrl = () => {
    if (!user || !user.photo || user.photo.trim() === "") {
      return "/default-avatar.png";
    }
    return `${API_BASE}/uploads/profiles/${user.photo}`;
  };

  const getSellerPhotoUrl = (seller) => {
    if (!seller || !seller.photo || seller.photo.trim() === "") {
      return "/default-avatar.png";
    }
    return `${API_BASE}/uploads/profiles/${seller.photo}`;
  };

  // -------------------- Profile Edit Handlers --------------------
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ text: "File size must be less than 5MB", type: "error" });
        return;
      }

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ text: "Only image files are allowed (JPEG, PNG, GIF, WebP)", type: "error" });
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setMessage({ text: "", type: "" });

    const token = localStorage.getItem("token");
    
    if (!token) {
      setMessage({ text: "Please login again", type: "error" });
      setUpdateLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    
    formDataToSend.append("name", formData.name || "");
    formDataToSend.append("contact", formData.contact || "");
    formDataToSend.append("department", formData.department || "");
    formDataToSend.append("year", formData.year || "");
    
    if (photoFile) {
      formDataToSend.append("photo", photoFile);
    }

    try {
      const response = await fetch(`${API_BASE}/api/users/update-profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = data.user;
        setUser(updatedUser);
        setGlobalUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setFormData({
          name: updatedUser.name || "",
          contact: updatedUser.contact || "",
          department: updatedUser.department || "",
          year: updatedUser.year || ""
        });
        
        setMessage({ text: "Profile updated successfully!", type: "success" });
        setIsEditing(false);
        setPhotoFile(null);
        setPhotoPreview(null);
        
        setTimeout(() => {
          setMessage({ text: "", type: "" });
        }, 3000);
      } else {
        setMessage({ text: data.message || "Failed to update profile", type: "error" });
      }
    } catch (error) {
      console.error("Update error:", error);
      setMessage({ text: "Network error. Please check your connection.", type: "error" });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({
      name: user.name || "",
      contact: user.contact || "",
      department: user.department || "",
      year: user.year || ""
    });
    setMessage({ text: "", type: "" });
  };

  // -------------------- Navigation Scroll Handler --------------------
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // -------------------- Chatbot Component --------------------
  const Chatbot = () => (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 8px 24px rgba(102,126,234,0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2), 0 12px 32px rgba(102,126,234,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15), 0 8px 24px rgba(102,126,234,0.2)';
          }}
        >
          💬
        </button>
      )}

      {isChatOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '380px',
          height: '600px',
          maxHeight: '80vh',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Campus Assistant</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Online • Always here to help</div>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1,
                opacity: 0.8,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              ×
            </button>
          </div>

          {chatMessages.length <= 1 && (
            <div style={{
              padding: '12px',
              background: '#f8f9fa',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {quickReplies.map(reply => (
                <button
                  key={reply.id}
                  onClick={() => handleQuickReply(reply.text)}
                  style={{
                    padding: '8px 14px',
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#667eea';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = 'black';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                >
                  <span>{reply.icon}</span>
                  <span>{reply.text}</span>
                </button>
              ))}
            </div>
          )}

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: '#f8f9fa'
          }}>
            {chatMessages.map((msg) => (
              <div key={msg.id}>
                <div style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.sender === 'user' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'white',
                    color: msg.sender === 'user' ? 'white' : '#333',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {msg.text}
                  </div>
                </div>

                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '16px',
                    marginLeft: msg.sender === 'bot' ? '0' : 'auto',
                    justifyContent: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                    maxWidth: '75%'
                  }}>
                    {msg.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickReply(suggestion)}
                        style={{
                          padding: '6px 12px',
                          background: 'white',
                          border: '1px solid #667eea',
                          borderRadius: '16px',
                          fontSize: '12px',
                          color: '#667eea',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#667eea';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.color = '#667eea';
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '16px'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  <div className="typing-dot" style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'bounce 1.4s infinite ease-in-out 0.2s'
                  }} />
                  <div className="typing-dot" style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'bounce 1.4s infinite ease-in-out 0.4s'
                  }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: '16px',
            background: 'white',
            borderTop: '1px solid #e9ecef',
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #dee2e6',
                borderRadius: '24px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#dee2e6'}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim()}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: chatInput.trim() 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#e9ecef',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                if (chatInput.trim()) e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );

  // -------------------- Default Home (Guest View) --------------------
  const DefaultHome = () => (
    <div className="default-home-container">
      <nav className="top-navbar">
        <div className="top-navbar-container">
          <div className="navbar-logo">
            <h1>Campus Aggregator</h1>
          </div>
          <ul className="navbar-menu">
            <li><a onClick={() => scrollToSection('hero')}>Home</a></li>
            <li><a onClick={() => scrollToSection('how-it-works')}>How It Works</a></li>
            <li><a onClick={() => scrollToSection('about-us')}>About Us</a></li>
            <li><a onClick={() => scrollToSection('contact-us')}>Contact Us</a></li>
          </ul>
          <div className="navbar-auth-buttons">
            <button className="navbar-login-btn" onClick={() => navigate("/login")}>Login</button>
            <button className="navbar-signup-btn" onClick={() => navigate("/signup")}>Sign Up</button>
          </div>
        </div>
      </nav>

      <section id="hero" className="hero">
        <div className="hero-text">
          <h1 className="hero-title">Welcome to <span>Campus Aggregator</span></h1>
          <p className="hero-subtitle">
            Your one-stop platform to <strong>share</strong> and <strong>borrow</strong> 
            essential campus items — from books to calculators!
          </p>
        </div>
      </section>

      <section className="image-collage-section">
        <div className="collage-container">
          <div className="collage-image">
            <img src="/collage-image-1.jpg" alt="Campus Life 1" />
            <div className="image-overlay"></div>
          </div>
          <div className="collage-image">
            <img src="/collage-image-2.jpg" alt="Campus Life 2" />
            <div className="image-overlay"></div>
          </div>
          <div className="collage-image">
            <img src="/collage-image-3.jpg" alt="Campus Life 3" />
            <div className="image-overlay"></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>List or Browse</h3>
            <p>Add items you want to rent/sell or search for what you need from peers.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Connect</h3>
            <p>Contact sellers directly, arrange pickup, and complete the transaction.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Share Knowledge</h3>
            <p>Upload study materials and notes to help fellow students succeed.</p>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose Campus Aggregator?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>📚 Rent Books & Items</h3>
            <p>Access textbooks, lab equipment, calculators, and study materials from seniors at affordable prices.</p>
          </div>
          <div className="feature-card">
            <h3>🤝 Help Your Community</h3>
            <p>List items you no longer need and earn extra income while helping juniors.</p>
          </div>
          <div className="feature-card">
            <h3>🧠 Knowledge Sharing</h3>
            <p>Upload and download study notes, past papers, and learning resources.</p>
          </div>
          <div className="feature-card">
            <h3>💬 Direct Communication</h3>
            <p>Chat directly with sellers and buyers. No middleman, no hassle.</p>
          </div>
          <div className="feature-card">
            <h3>🔒 Safe & Secure</h3>
            <p>Verified college students only. Your campus community ensures trusted transactions.</p>
          </div>
          <div className="feature-card">
            <h3>♻️ Sustainable Living</h3>
            <p>Reduce waste by reusing textbooks and items. Contribute to a greener campus.</p>
          </div>
        </div>
      </section>

      <section id="about-us" className="about-us-section">
        <h2>About Us</h2>
        <p>Campus Aggregator is a student-driven platform designed to make campus life easier and more sustainable.</p>
        <div className="about-cta">
          <h3>Ready to join the movement? It's time to share, discover, and connect.</h3>
          <div className="about-buttons">
            <button className="cta-btn primary" onClick={() => navigate("/signup")}>
              🚀 Get Started
            </button>
            <button className="cta-btn secondary" onClick={() => scrollToSection('how-it-works')}>
              📖 Learn How It Works
            </button>
          </div>
        </div>
      </section>

      <section id="contact-us" className="contact-us-section">
        <h2>Contact Us</h2>
        <p className="contact-intro">Have questions or need assistance? We're here to help!</p>
        <div className="contact-details-vertical">
          <div className="contact-item-vertical">
            <div className="contact-icon">📍</div>
            <h3>Address</h3>
            <p>National Engineering College</p>
            <p>Kovilpatti, Tamil Nadu</p>
          </div>
          <div className="contact-item-vertical">
            <div className="contact-icon">📞</div>
            <h3>Phone</h3>
            <p><a href="tel:+919486742400">+91 94867 42400</a></p>
            <p><a href="tel:+919025425900">+91 90254 25900</a></p>
          </div>
          <div className="contact-item-vertical">
            <div className="contact-icon">📧</div>
            <h3>Email</h3>
            <p><a href="mailto:campusaggregator.app@gmail.com">campusaggregator.app@gmail.com</a></p>
          </div>
        </div>
      </section>

      <Chatbot />
    </div>
  );

  // -------------------- Notifications View --------------------
  const NotificationsView = () => {
    return (
      <div className="notifications-container">
        <div className="notifications-header">
          <h2>🔔 Notifications</h2>
          <div className="notifications-header-actions">
            <button className="back-btn" onClick={() => setView("home")}>
              ⬅ Back to Home
            </button>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={markAllAsRead}>
                ✓ Mark All as Read
              </button>
            )}
          </div>
        </div>

        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <p>📭 No notifications yet</p>
              <p className="subtitle">You'll be notified when there's activity on your items</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => {
                  if (!notification.isRead) {
                    markNotificationAsRead(notification._id);
                  }
                }}
              >
                <div className="notification-icon">
                  {notification.type === 'request' && '📩'}
                  {notification.type === 'message' && '💬'}
                  {notification.type === 'item' && '📦'}
                  {notification.type === 'system' && '🔔'}
                </div>
                <div className="notification-content">
                  <p className="notification-message">{notification.message}</p>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                {!notification.isRead && <div className="unread-indicator"></div>}
              </div>
            ))
          )}
        </div>

        <Chatbot />
      </div>
    );
  };

  // -------------------- Profile View --------------------
  const ProfileView = () => {
    const displayPhotoUrl = photoPreview || getPhotoUrl();

    return (
      <div className="profile-container">
        <div className="profile-header">
          <h2>👤 My Profile</h2>
          <div className="profile-header-actions">
            <button className="back-btn" onClick={() => {
              setView("home");
              setIsEditing(false);
              setMessage({ text: "", type: "" });
            }}>
              ⬅ Back to Home
            </button>
            {!isEditing && (
              <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>

        {message.text && (
          <div className={`profile-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleProfileUpdate} className="profile-edit-form">
            <div className="profile-photo-section">
              <label htmlFor="photo-upload" className="photo-upload-label">
                <img
                  src={displayPhotoUrl}
                  alt="Profile"
                  className="profile-photo"
                  onError={(e) => (e.target.src = "/default-avatar.png")}
                />
                <div className="photo-overlay">
                  📷 Change Photo
                </div>
              </label>
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              {photoFile && (
                <p className="photo-filename">Selected: {photoFile.name}</p>
              )}
            </div>

            <div className="profile-form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="profile-form-group">
              <label>Email:</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="disabled-input"
                title="Email cannot be changed"
              />
              <small className="field-hint">Email cannot be changed</small>
            </div>

            <div className="profile-form-group">
              <label>Contact:</label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="profile-form-group">
              <label>Department:</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., Computer Science"
                required
              />
            </div>

            <div className="profile-form-group">
              <label>Year:</label>
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                placeholder="e.g., 3"
                required
              />
            </div>

            <div className="profile-form-actions">
              <button type="submit" className="save-profile-btn" disabled={updateLoading}>
                {updateLoading ? "Updating..." : "💾 Update Profile"}
              </button>
              <button type="button" className="cancel-profile-btn" onClick={handleCancelEdit}>
                ❌ Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-card">
            <img
              src={getPhotoUrl()}
              alt="Profile"
              className="profile-photo"
              onError={(e) => (e.target.src = "/default-avatar.png")}
            />
            <div className="profile-details">
              <p><strong>Name:</strong> {user?.name || "Not set"}</p>
              <p><strong>Email:</strong> {user?.email || "N/A"}</p>
              <p><strong>Contact:</strong> {user?.contact || "Not set"}</p>
              <p><strong>Department:</strong> {user?.department || "Not set"}</p>
              <p><strong>Year:</strong> {user?.year || "Not set"}</p>
              <p><strong>Username:</strong> {user?.username || "N/A"}</p>
            </div>
          </div>
        )}

        <Chatbot />
      </div>
    );
  };

  // ==================== MODERN PERSONALIZED HOME ====================
  const PersonalizedHome = () => (
    <div className="modern-feed-wrapper">
      {/* Modern Glassmorphic Navbar */}
      <nav className="modern-nav">
        <div className="modern-nav-content">
          <div className="nav-left-section">
            <button className="modern-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            <h1 className="modern-logo">
              <span className="logo-icon">🎓</span>
              Campus Aggregator
            </h1>
          </div>
          
          <div className="nav-right-section">
            <button 
              className="modern-notification-btn"
              onClick={() => setView("notifications")}
              title="Notifications"
            >
              <span className="notification-icon">🔔</span>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
            
            <div className="modern-profile-section" onClick={() => setView("profile")}>
              <img
                src={getPhotoUrl()}
                alt="Profile"
                className="modern-profile-avatar"
                onError={(e) => (e.target.src = "/default-avatar.png")}
              />
              <div className="profile-info-container">
                <span className="profile-name">{user?.name || 'User'}</span>
                <span className="profile-role">{user?.department ? `${user.department} • Year ${user.year}` : 'Student'}</span>
              </div>
            </div>
            
            <button onClick={handleLogout} className="modern-logout-btn">
              <span className="logout-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="modern-main-layout">
        {/* Modern Sidebar */}
        <aside className={`modern-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="sidebar-content">
            <div className="sidebar-user-card">
              <img
                src={getPhotoUrl()}
                alt="User"
                className="sidebar-user-avatar"
                onError={(e) => (e.target.src = "/default-avatar.png")}
              />
              <div className="sidebar-user-info">
                <h3>{user?.name || 'User'}</h3>
                <p>{user?.department || 'Student'}</p>
              </div>
            </div>

            <nav className="sidebar-nav">
              <button className="sidebar-nav-item" onClick={() => navigate("/add-item")}>
                <span className="nav-item-icon">➕</span>
                <span className="nav-item-text">Add Item</span>
              </button>
              <button className="sidebar-nav-item" onClick={() => navigate("/cart")}>
                <span className="nav-item-icon">🛒</span>
                <span className="nav-item-text">My Cart</span>
              </button>
              <button className="sidebar-nav-item" onClick={() => navigate("/my-items")}>
                <span className="nav-item-icon">📦</span>
                <span className="nav-item-text">My Items</span>
              </button>
              <button className="sidebar-nav-item" onClick={() => navigate("/contact")}>
                <span className="nav-item-icon">📞</span>
                <span className="nav-item-text">Contact Seller</span>
              </button>
              <button className="sidebar-nav-item" onClick={() => navigate("/requests")}>
                <span className="nav-item-icon">📩</span>
                <span className="nav-item-text">Buyer Requests</span>
              </button>
              <button className="sidebar-nav-item" onClick={() => navigate("/knowledge-share")}>
                <span className="nav-item-icon">🧠</span>
                <span className="nav-item-text">Knowledge Share</span>
              </button>
              <button className="sidebar-nav-item" onClick={() => navigate("/knowledge-list")}>
                <span className="nav-item-icon">📚</span>
                <span className="nav-item-text">Explore Notes</span>
              </button>
              <button className="sidebar-nav-item" onClick={() => setView("profile")}>
                <span className="nav-item-icon">👤</span>
                <span className="nav-item-text">My Profile</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Feed Content */}
        <main className="modern-feed-main">
          <div className="feed-wrapper-container">
            {/* Modern Search Bar */}
            <div className="modern-search-section">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search for items, categories..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="modern-search-input"
                />
                {searchTerm && (
                  <button className="search-clear" onClick={() => {
                    setSearchTerm("");
                    setFilteredItems(items);
                  }}>
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Feed Grid */}
            {productsLoading ? (
              <div className="modern-loading-state">
                <div className="skeleton-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton-image"></div>
                      <div className="skeleton-content">
                        <div className="skeleton-line skeleton-title"></div>
                        <div className="skeleton-line skeleton-text"></div>
                        <div className="skeleton-line skeleton-text-short"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="modern-empty-state">
                <div className="empty-state-icon">📦</div>
                <h2>No Items Found</h2>
                <p>Be the first to add items to the feed!</p>
                <button className="empty-state-btn" onClick={() => navigate("/add-item")}>
                  ➕ Add Your First Item
                </button>
              </div>
            ) : (
              <div className="modern-feed-grid">
                {filteredItems.map((item, index) => (
                  <div key={item._id} className="modern-product-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    {/* Card Header with Seller Info */}
                    <div className="card-header-section">
                      <div className="seller-info-compact">
                        <img
                          src={getSellerPhotoUrl(item.seller)}
                          alt={item.seller?.name || 'Seller'}
                          className="seller-avatar-small"
                          onError={(e) => (e.target.src = "/default-avatar.png")}
                        />
                        <div className="seller-details-compact">
                          <h4>{item.seller?.name || 'Unknown'}</h4>
                          <p>{item.seller?.department || 'Student'}</p>
                        </div>
                      </div>
                      <button className="card-menu-btn">⋯</button>
                    </div>

                    {/* Product Image */}
                    <div className="card-image-container">
                      {item.photos && item.photos.length > 0 ? (
                        <img
                          src={`${API_BASE}/uploads/${item.photos[0]}`}
                          alt={item.name}
                          className="card-product-image"
                          onError={(e) => (e.target.src = "/placeholder-item.png")}
                        />
                      ) : (
                        <div className="card-image-placeholder">
                          <span className="placeholder-emoji">📦</span>
                        </div>
                      )}
                      
                      {/* Stock Badge */}
                      <div className={`stock-badge ${!item.available || item.quantity === 0 ? 'out-of-stock' : 'in-stock'}`}>
                        {!item.available || item.quantity === 0 ? '❌ Out of Stock' : `✓ ${item.quantity} Available`}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="card-content-section">
                      <div className="card-price-row">
                        <span className="card-price">₹{item.price}</span>
                        <div className="card-stats">
                          <span className="stat-item">👁️ 0</span>
                          <span className="stat-item">❤️ 0</span>
                        </div>
                      </div>

                      <h3 className="card-product-title">{item.name}</h3>

                      <div className="card-meta-info">
                        <span className="meta-tag">
                          📅 {item.yearsUsed} {item.yearsUsed === 1 ? 'year' : 'years'}
                        </span>
                        <span className="meta-tag">
                          {item.deliveryOption === 'seller_delivery' ? '🚚 Delivery' : '🏃 Pickup'}
                        </span>
                      </div>

                      <p className="card-posted-time">
                        Posted {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="card-actions-section">
                      <button
                        className={`card-action-btn cart-btn ${!item.available || item.quantity === 0 ? 'btn-disabled' : ''}`}
                        onClick={() => handleAddToCart(item._id)}
                        disabled={!item.available || item.quantity === 0}
                      >
                        <span className="btn-icon">🛒</span>
                        <span className="btn-text">Add to Cart</span>
                      </button>
                      <button
                        className={`card-action-btn pay-btn ${!item.available || item.quantity === 0 ? 'btn-disabled' : ''}`}
                        onClick={() => handlePayNow(item)}
                        disabled={!item.available || item.quantity === 0}
                      >
                        <span className="btn-icon">💳</span>
                        <span className="btn-text">Pay Now</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <Chatbot />
    </div>
  );

  // -------------------- Render --------------------
  if (loading) return <div className="loading-container">Loading...</div>;
  if (!user) return <DefaultHome />;
  if (view === "home") return <PersonalizedHome />;
  if (view === "profile") return <ProfileView />;
  if (view === "notifications") return <NotificationsView />;
  return <DefaultHome />;
}

export default Home;