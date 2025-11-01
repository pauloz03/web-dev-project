import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarLeft from "../components/navbar2.js";
import "./mainPage.css";

const Main = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("general");

  const handleStartChat = () => {
    if (!roomName.trim()) return;
    navigate(`/chat/${roomName}`);
  };

  return (
    <>
      <NavbarLeft />
      <div className="main-container">
        <div className="main-panel">
          <input
            type="text"
            placeholder="Enter room name..."
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />

          <div className="button-group">
            <button className="start-chat-btn" onClick={handleStartChat}>
              Start Chat
            </button>
            <button className="add-friend-btn">
              Add Friend
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Main;
