import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./mainPage.css";

const Main = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("general"); // default room

  const handleStartChat = () => {
    if (!roomName.trim()) return;
    navigate(`/chat/${roomName}`); // include room name in URL
  };

  return (
    <div className="main-container">
      <p className="welcome-text">Welcome</p>

      <input
        type="text"
        placeholder="Enter room name..."
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />

      <button className="start-chat-btn" onClick={handleStartChat}>
        Start Chat
      </button>
    </div>
  );
};

export default Main;
