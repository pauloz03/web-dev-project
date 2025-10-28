import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import chatRouter from "./chat.js";
import Room from "./model.js"; // import your Mongoose model

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your React app URL
    methods: ["GET", "POST"],
  },
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

// Socket.io logic
io.on("connection", (socket) => {
  console.log("🟢 New user connected:", socket.id);

  // When a user joins a room
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`👋 User joined room: ${roomName}`);
  });

  // When a message is sent
  socket.on("send_message", async (data) => {
    console.log("📨 Message received:", data);

    try {
      // Find the room by name
      let room = await Room.findOne({ name: data.room });

      // If the room doesn't exist, create it
      if (!room) {
        room = new Room({ name: data.room, messages: [] });
      }

      // Construct the message object
      const messageObj = {
        authorUsername: data.authorUsername,
        content: data.content,
        createdAt: new Date(),
      };

      // Add the new message to the room
      room.messages.push(messageObj);

      // Save the updated room
      await room.save();

      // Emit the saved message to everyone in the room (including sender)
      io.to(data.room).emit("receive_message", messageObj);
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
