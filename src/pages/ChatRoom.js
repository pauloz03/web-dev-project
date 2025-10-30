// src/pages/ChatRoom.js
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import "./ChatRoom.css";

const BACKEND_URL = "http://localhost:5001";

const ChatRoom = () => {
  const { roomName } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("Anonymous");
  const messagesEndRef = useRef(null);

  const [socket, setSocket] = useState(null);

  // 0️⃣ Initialize socket connection once
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 1️⃣ Fetch existing messages on mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/chat/${roomName}`);
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();
  }, [roomName]);

  // 2️⃣ Join socket room & listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    socket.emit("join_room", roomName);

    const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on("receive_message", handleMessage);

    return () => socket.off("receive_message", handleMessage);
  }, [socket, roomName]);

  // 3️⃣ Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4️⃣ Send message
  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      authorUsername: username || "Anonymous",
      content: newMessage,
      room: roomName,
    };

    // Emit via socket only
    socket.emit("send_message", messageData);

    // Clear input
    setNewMessage("");
  };

  return (
    <div className="chat-room">
      <h2>Room: {roomName}</h2>

      <input
        type="text"
        className="username-input"
        placeholder="Enter your name..."
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <div className="messages">
        {messages.length > 0 ? (
          messages.map((msg, i) => (
            <div key={i} className="message">
              <strong>{msg.authorUsername}:</strong> {msg.content}
            </div>
          ))
        ) : (
          <p className="no-messages">No messages yet. Say hi! 👋</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="message-form">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatRoom;
