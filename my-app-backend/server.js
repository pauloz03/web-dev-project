// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import chatRouter from "./chat.js";
import Room from "./model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/chat", chatRouter);

// Default route
app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

// Socket.io
io.on("connection", (socket) => {
  console.log("🟢 New user connected:", socket.id);

  // Join room
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`👋 User joined room: ${roomName}`);
  });

  // Handle message
  socket.on("send_message", async (data) => {
    console.log("📨 Message received:", data);

    const messageObj = { ...data, createdAt: new Date() };

    // Emit immediately to everyone in room
    io.to(data.room).emit("receive_message", messageObj);

    // Save in DB asynchronously
    try {
      let room = await Room.findOne({ name: data.room });
      if (!room) room = new Room({ name: data.room, messages: [] });
      room.messages.push(messageObj);
      await room.save();
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
