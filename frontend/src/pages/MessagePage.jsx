import React, { useState, useEffect, useRef } from 'react';

function MessagesPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const API_BASE = 'http://localhost:5000';

  // Initialize user
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch conversations
  useEffect(() => {
    if (user) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      const interval = setInterval(() => fetchMessages(selectedChat._id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/messages/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/users/search?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSearchResults(data.filter(u => u._id !== user._id) || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    const tempMessage = {
      _id: Date.now(),
      text: messageInput,
      sender: user._id,
      receiver: selectedChat._id,
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, tempMessage]);
    const messageText = messageInput;
    setMessageInput('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedChat._id,
          text: messageText
        })
      });

      if (response.ok) {
        fetchMessages(selectedChat._id);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startChat = (user) => {
    setSelectedChat(user);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const time = `${hours > 12 ? hours - 12 : hours}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;

    if (diff < 86400000) return time;
    if (diff < 172800000) return `Yesterday`;
    if (diff < 604800000) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return '/default-avatar.png';
    return `${API_BASE}/uploads/profiles/${photoPath}`;
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f0f2f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#00a884',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={getPhotoUrl(user?.photo)}
            alt="Profile"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
            onError={(e) => e.target.src = '/default-avatar.png'}
          />
          <h1 style={{ fontSize: '20px', margin: 0 }}>Messages</h1>
        </div>
        <button
          onClick={() => window.history.back()}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar - Conversations List */}
        <div style={{
          width: '380px',
          background: 'white',
          borderRight: '1px solid #e9edef',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Search Header */}
          <div style={{ padding: '12px', background: '#f0f2f5' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => setShowSearch(true)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'white'
                }}
              />
            </div>
          </div>

          {/* Search Results or Conversations */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {showSearch && searchQuery ? (
              // Search Results
              <div>
                {isSearching ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#667781' }}>
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#667781' }}>
                    No users found
                  </div>
                ) : (
                  searchResults.map(user => (
                    <div
                      key={user._id}
                      onClick={() => startChat(user)}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        background: 'white',
                        borderBottom: '1px solid #f0f2f5',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f6f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <img
                        src={getPhotoUrl(user.photo)}
                        alt={user.name}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => e.target.src = '/default-avatar.png'}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', fontSize: '16px', color: '#111b21' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#667781' }}>
                          {user.department} • Year {user.year}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Conversations List
              <div>
                {conversations.length === 0 ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#667781'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>No conversations yet</p>
                    <p style={{ fontSize: '14px' }}>Search for users to start chatting</p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv._id}
                      onClick={() => {
                        setSelectedChat(conv);
                        setShowSearch(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        background: selectedChat?._id === conv._id ? '#f5f6f6' : 'white',
                        borderBottom: '1px solid #f0f2f5',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f6f6'}
                      onMouseLeave={(e) => {
                        if (selectedChat?._id !== conv._id) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <img
                          src={getPhotoUrl(conv.photo)}
                          alt={conv.name}
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => e.target.src = '/default-avatar.png'}
                        />
                        {conv.unreadCount > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            background: '#00a884',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <div style={{
                            fontWeight: conv.unreadCount > 0 ? '600' : '500',
                            fontSize: '16px',
                            color: '#111b21',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {conv.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#667781' }}>
                            {formatTime(conv.lastMessageTime)}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: conv.unreadCount > 0 ? '#111b21' : '#667781',
                          fontWeight: conv.unreadCount > 0 ? '500' : '400',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conv.lastMessage}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#efeae2'
        }}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div style={{
                background: '#f0f2f5',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderBottom: '1px solid #d1d7db'
              }}>
                <img
                  src={getPhotoUrl(selectedChat.photo)}
                  alt={selectedChat.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => e.target.src = '/default-avatar.png'}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', fontSize: '16px', color: '#111b21' }}>
                    {selectedChat.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#667781' }}>
                    {selectedChat.department && selectedChat.year 
                      ? `${selectedChat.department} • Year ${selectedChat.year}`
                      : 'Campus User'}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23efeae2\'/%3E%3C/svg%3E")'
              }}>
                {messages.map((msg) => {
                  const isSent = msg.sender === user?._id;
                  return (
                    <div
                      key={msg._id}
                      style={{
                        display: 'flex',
                        justifyContent: isSent ? 'flex-end' : 'flex-start',
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{
                        maxWidth: '65%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: isSent ? '#d9fdd3' : 'white',
                        boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#111b21',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {msg.text}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#667781',
                          marginTop: '4px',
                          textAlign: 'right',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px'
                        }}>
                          <span>{formatTime(msg.timestamp)}</span>
                          {isSent && (
                            <span style={{ color: msg.status === 'read' ? '#53bdeb' : '#667781' }}>
                              {msg.status === 'sending' ? '🕐' : '✓✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{
                background: '#f0f2f5',
                padding: '12px 16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <input
                  ref={messageInputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '24px',
                    fontSize: '15px',
                    outline: 'none',
                    background: 'white'
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: messageInput.trim() ? '#00a884' : '#e9edef',
                    border: 'none',
                    color: 'white',
                    fontSize: '20px',
                    cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (messageInput.trim()) {
                      e.currentTarget.style.background = '#06cf9c';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = messageInput.trim() ? '#00a884' : '#e9edef';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ➤
                </button>
              </div>
            </>
          ) : (
            // Empty State
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#667781'
            }}>
              <div style={{
                width: '320px',
                textAlign: 'center',
                padding: '40px'
              }}>
                <div style={{ fontSize: '120px', marginBottom: '24px' }}>💬</div>
                <h2 style={{ fontSize: '32px', fontWeight: '300', marginBottom: '16px', color: '#41525d' }}>
                  Campus Aggregator Messages
                </h2>
                <p style={{ fontSize: '14px', lineHeight: '20px' }}>
                  Connect with your campus community. Search for users above to start a conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;