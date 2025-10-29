// frontend/src/pages/Contact.jsx
import React, { useState, useEffect } from "react";
import "./Contact.css";

function Contact({ loggedInUser }) { // receive the logged-in user as prop
  const [searchName, setSearchName] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  const handleSearch = async () => {
    if (!searchName.trim()) {
      setMessage("Please enter a name to search.");
      setResults([]);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/contacts/search?name=${searchName}`
      );
      const data = await res.json();

      if (res.ok) {
        console.log("Search results:", data); // log search results for debugging
        setResults(data);
        setMessage("");
      } else {
        setResults([]);
        setMessage(data.message || "No users found");
      }
    } catch (err) {
      console.error("Search error:", err);
      setMessage("❌ Server error while searching");
      setResults([]);
    }
  };

  // Export contact as vCard (.vcf)
  const exportContact = (user) => {
    const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${user.name}
EMAIL:${user.email}
TEL:${user.contact || ""}
END:VCARD
    `;
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${user.name}.vcf`;
    link.click();
  };

  return (
    <div className="contact-page">
      {/* ✅ Logged-in user avatar at the top */}
      {loggedInUser && (
        <div className="logged-in-user">
          <img
            src={loggedInUser.photo && loggedInUser.photo.trim() !== "" ? `http://localhost:5000/uploads/${loggedInUser.photo}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt={loggedInUser.name}
            className="profile-pic-large"
          />
          <h2>Welcome, {loggedInUser.name}!</h2>
        </div>
      )}

      <h2>🔍 Search User Contact</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter user name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {message && <p className="error">{message}</p>}

      <ul className="contact-results">
        {results.map((user) => (
          <li key={user._id} className="contact-card">
            {/* Profile picture for each search result */}
            <img
            src={user.photo && user.photo.trim() !== "" ? `http://localhost:5000/uploads/${user.photo}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt={user.name}
              className="profile-pic"
            />

            <div className="contact-info">
              <h3>{user.name}</h3>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Contact:</strong> {user.contact || "Not available"}
              </p>

              <button
                onClick={() => exportContact(user)}
                className="export-btn"
              >
                📤 Export Contact
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Contact;
