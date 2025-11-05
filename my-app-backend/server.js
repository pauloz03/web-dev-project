// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import chatRouter from "./chat.js";
import documentsRouter from "./documents.js";
import invitationsRouter from "./invitations.js";
import Room, { Document } from "./model.js";

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
app.use("/documents", documentsRouter);
app.use("/invitations", invitationsRouter);

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

  // ============================================
  // REAL-TIME TEXT EDITOR EVENTS
  // ============================================
  
  // Join document room for editing
  socket.on("join_document", async (documentName) => {
    socket.join(`doc_${documentName}`);
    console.log(`📝 User joined document: ${documentName}`);
    
    // Send current document content to the new user
    try {
      let doc = await Document.findOne({ name: documentName });
      if (!doc) {
        // Create new document if it doesn't exist
        doc = new Document({ name: documentName, content: "" });
        await doc.save();
      }
      socket.emit("document_content", { content: doc.content, documentName });
    } catch (err) {
      console.error("❌ Error fetching document:", err);
    }
  });

  // Handle text changes (insertions, deletions)
  socket.on("text_change", async (data) => {
    const { documentName, change, userId } = data;
    
    // Broadcast change to all other users in the document room
    socket.to(`doc_${documentName}`).emit("text_change", {
      change,
      userId,
      documentName,
    });
    
    // Save to database (debounced - could be optimized)
    try {
      await Document.findOneAndUpdate(
        { name: documentName },
        { 
          $set: { 
            content: data.fullContent || "", // Update full content
            updatedAt: new Date() 
          } 
        },
        { upsert: true } // Create if doesn't exist
      );
    } catch (err) {
      console.error("❌ Error saving document:", err);
    }
  });

  // Handle cursor position updates (optional, for showing where users are typing)
  socket.on("cursor_position", (data) => {
    const { documentName, position, userId, username } = data;
    socket.to(`doc_${documentName}`).emit("cursor_position", {
      position,
      userId,
      username,
      documentName,
    });
  });

  // Leave document room
  socket.on("leave_document", (documentName) => {
    socket.leave(`doc_${documentName}`);
    console.log(`📝 User left document: ${documentName}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
