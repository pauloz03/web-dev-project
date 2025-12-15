import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NavbarLeft from "../components/navbar2.js";
import { useAuth } from "../contexts/AuthContext";
import "./Friends.css";

const BACKEND_URL = "http://localhost:5001";

const Friends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("add"); // "add", "requests", "friends"
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const fetchFriendRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoadingRequests(true);
    try {
      const [sentRes, receivedRes] = await Promise.all([
        fetch(`${BACKEND_URL}/friends/requests?userId=${user.id}&type=sent`),
        fetch(`${BACKEND_URL}/friends/requests?userId=${user.id}&type=received`),
      ]);

      const sentData = await sentRes.json();
      const receivedData = await receivedRes.json();

      setSentRequests(sentData.requests || []);
      setReceivedRequests(receivedData.requests || []);
    } catch (err) {
      console.error("Error fetching friend requests:", err);
      setMessage({ type: "error", text: "Error loading friend requests" });
    } finally {
      setLoadingRequests(false);
    }
  }, [user?.id]);

  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFriends(true);
    try {
      const res = await fetch(`${BACKEND_URL}/friends/list?userId=${user.id}`);
      const data = await res.json();
      setFriends(data.friends || []);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setMessage({ type: "error", text: "Error loading friends list" });
    } finally {
      setLoadingFriends(false);
    }
  }, [user?.id]);

  // Fetch friend requests and friends list
  useEffect(() => {
    if (user && activeTab === "requests") {
      fetchFriendRequests();
    }
    if (user && activeTab === "friends") {
      fetchFriends();
    }
  }, [user, activeTab, fetchFriendRequests, fetchFriends]);

  // Search for user by email
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter an email address" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });
    setSearchResults(null);

    try {
      const res = await fetch(
        `${BACKEND_URL}/friends/search?email=${encodeURIComponent(email)}`
      );
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

  // Send friend request
  const handleSendFriendRequest = async () => {
    if (!searchResults || !user) {
      setMessage({ type: "error", text: "Please search for a user first" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${BACKEND_URL}/friends/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverEmail: email,
          senderId: user.id,
          senderEmail: user.email || "Unknown",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Friend request sent successfully!" });
        setEmail("");
        setSearchResults(null);
        // Refresh sent requests if on requests tab
        if (activeTab === "requests") {
          fetchFriendRequests();
        }
      } else {
        setMessage({ type: "error", text: data.message || "Failed to send friend request" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error sending friend request" });
    } finally {
      setLoading(false);
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (requestId) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/friends/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Friend request accepted!" });
        fetchFriendRequests();
        // Refresh friends list if on friends tab
        if (activeTab === "friends") {
          fetchFriends();
        }
      } else {
        setMessage({ type: "error", text: data.message || "Failed to accept request" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error accepting friend request" });
    } finally {
      setLoading(false);
    }
  };

  // Reject friend request
  const handleRejectRequest = async (requestId) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/friends/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Friend request rejected" });
        fetchFriendRequests();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to reject request" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error rejecting friend request" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavbarLeft />
      <div className="friends-container">
        <div className="friends-content">
          <h2>Friends</h2>

          {/* Tabs */}
          <div className="friends-tabs">
            <button
              className={`tab ${activeTab === "add" ? "active" : ""}`}
              onClick={() => setActiveTab("add")}
            >
              Add Friend
            </button>
            <button
              className={`tab ${activeTab === "requests" ? "active" : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              Requests
              {receivedRequests.length > 0 && (
                <span className="badge">{receivedRequests.length}</span>
              )}
            </button>
            <button
              className={`tab ${activeTab === "friends" ? "active" : ""}`}
              onClick={() => setActiveTab("friends")}
            >
              My Friends ({friends.length})
            </button>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}

          {/* Add Friend Tab */}
          {activeTab === "add" && (
            <div className="add-friend-section">
              <p className="subtitle">
                Search for users by email and send them a friend request
              </p>

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
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={loading}
                      className="send-request-btn"
                    >
                      {loading ? "Sending..." : "Send Friend Request"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Friend Requests Tab */}
          {activeTab === "requests" && (
            <div className="requests-section">
              {loadingRequests ? (
                <p>Loading requests...</p>
              ) : (
                <>
                  {/* Received Requests */}
                  {receivedRequests.length > 0 && (
                    <div className="requests-group">
                      <h3>Received Requests ({receivedRequests.length})</h3>
                      <div className="requests-list">
                        {receivedRequests.map((request) => (
                          <div key={request._id} className="request-card">
                            <div className="request-info">
                              <h4>{request.senderEmail}</h4>
                              <p className="request-date">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="request-actions">
                              <button
                                onClick={() => handleAcceptRequest(request._id)}
                                disabled={loading}
                                className="accept-btn"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request._id)}
                                disabled={loading}
                                className="reject-btn"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent Requests */}
                  {sentRequests.length > 0 && (
                    <div className="requests-group">
                      <h3>Sent Requests ({sentRequests.length})</h3>
                      <div className="requests-list">
                        {sentRequests.map((request) => (
                          <div key={request._id} className="request-card">
                            <div className="request-info">
                              <h4>{request.receiverEmail}</h4>
                              <p className="request-status">
                                Status:{" "}
                                <span
                                  className={`status ${request.status}`}
                                >
                                  {request.status}
                                </span>
                              </p>
                              <p className="request-date">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {receivedRequests.length === 0 &&
                    sentRequests.length === 0 && (
                      <p className="no-requests">No friend requests</p>
                    )}
                </>
              )}
            </div>
          )}

          {/* Friends List Tab */}
          {activeTab === "friends" && (
            <div className="friends-section">
              {loadingFriends ? (
                <p>Loading friends...</p>
              ) : friends.length > 0 ? (
                <div className="friends-list">
                  {friends.map((friend) => (
                    <div key={friend.id} className="friend-card">
                      <div className="friend-info">
                        <h4>{friend.email}</h4>
                        <p className="friend-date">
                          Friends since{" "}
                          {new Date(friend.friendshipDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-friends">No friends yet. Start adding friends!</p>
              )}
            </div>
          )}

          <button onClick={() => navigate("/main")} className="back-btn">
            Back to Main Page
          </button>
        </div>
      </div>
    </>
  );
};

export default Friends;

