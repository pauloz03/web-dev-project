import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarLeft from "../components/navbar2.js";
import { useAuth } from "../contexts/AuthContext";
import "./InviteFriends.css";

const BACKEND_URL = "https://web-dev-project-1-blo3.onrender.com";


const InviteFriends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [selectedChecklist, setSelectedChecklist] = useState("");
  const [checklists, setChecklists] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch user's checklists
  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/documents`);
        const data = await res.json();
        setChecklists(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching checklists:", err);
      }
    };
    fetchChecklists();
  }, []);

  // Search for user by email
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter an email address" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${BACKEND_URL}/invitations/search?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      
      if (res.ok) {
        setSearchResults(data);
        setMessage({ type: "success", text: "User found!" });
      } else {
        setMessage({ type: "error", text: data.message || "User not found" });
        setSearchResults(null);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error searching for user" });
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Send invitation
  const handleSendInvitation = async () => {
    if (!selectedChecklist) {
      setMessage({ type: "error", text: "Please select a checklist" });
      return;
    }

    if (!searchResults) {
      setMessage({ type: "error", text: "Please search for a user first" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${BACKEND_URL}/invitations/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail: email,
          recipientId: searchResults.id,
          checklistName: selectedChecklist,
          senderEmail: user?.email || "Unknown",
          senderId: user?.id || "Unknown",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Invitation sent successfully!" });
        // Reset form
        setEmail("");
        setSelectedChecklist("");
        setSearchResults(null);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to send invitation" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error sending invitation" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavbarLeft />
      <div className="invite-container">
        <div className="invite-content">
          <h2>Invite Friends to Checklist</h2>
          <p className="subtitle">Search for users by email and invite them to collaborate</p>

          {/* Message Display */}
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleSearch} className="search-form">
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="search-btn">
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {/* Search Results */}
          {searchResults && (
            <div className="search-results">
              <div className="user-card">
                <div className="user-info">
                  <h3>{searchResults.email}</h3>
                  <p className="user-id">User ID: {searchResults.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Checklist Selection */}
          {checklists.length > 0 && (
            <div className="checklist-selection">
              <label htmlFor="checklist-select">Select Checklist to Share:</label>
              <select
                id="checklist-select"
                value={selectedChecklist}
                onChange={(e) => setSelectedChecklist(e.target.value)}
                className="checklist-select"
              >
                <option value="">-- Choose a checklist --</option>
                {checklists.map((checklist) => (
                  <option key={checklist._id || checklist.name} value={checklist.name}>
                    {checklist.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {checklists.length === 0 && (
            <p className="no-checklists">
              No checklists found. <button onClick={() => navigate("/collaborate")} className="link-btn">
                Create one first
              </button>
            </p>
          )}

          {/* Send Invitation Button */}
          {searchResults && selectedChecklist && (
            <button
              onClick={handleSendInvitation}
              disabled={loading}
              className="send-invite-btn"
            >
              {loading ? "Sending..." : "Send Invitation"}
            </button>
          )}

          <button onClick={() => navigate("/main")} className="back-btn">
            Back to Main Page
          </button>
        </div>
      </div>
    </>
  );
};

export default InviteFriends;

