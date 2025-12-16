// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import path from "path";

import chatRouter from "./chat.js";
import documentsRouter from "./documents.js";
import checklistsRouter from "./checklists.js";
import invitationsRouter from "./invitations.js";
import friendsRouter from "./friends.js";
import Room, { Document } from "./model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Use this in dev for local frontend; in production, same origin
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// API Routes
app.use("/chat", chatRouter);
app.use("/documents", documentsRouter);
app.use("/checklists", checklistsRouter);
app.use("/invitations", invitationsRouter);
app.use("/friends", friendsRouter);

// Serve React frontend
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "../my-app/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../my-app/build", "index.html"));
});

// Socket.io
const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("🟢 New user connected:", socket.id);

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`👋 User joined room: ${roomName}`);
  });

  socket.on("send_message", async (data) => {
    console.log("📨 Message received:", data);

    const messageObj = {
      authorUsername: data.authorUsername || "Anonymous",
      content: data.content || "",
      createdAt: new Date(),
    };

    io.to(data.room).emit("receive_message", { ...messageObj, room: data.room });

    try {
      if (!data.room) return console.error("❌ No room specified in message data");

      let room = await Room.findOne({ name: data.room });
      if (!room) room = new Room({ name: data.room, messages: [] });

      room.messages.push(messageObj);
      await room.save();
      console.log("✅ Message saved to database");
    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  socket.on("join_document", async (documentName) => {
    socket.join(`doc_${documentName}`);
    console.log(`📝 User joined document: ${documentName}`);

    try {
      let doc = await Document.findOne({ name: documentName });
      if (!doc) {
        doc = new Document({ name: documentName, content: "" });
        await doc.save();
      }
      socket.emit("document_content", { content: doc.content, documentName });
    } catch (err) {
      console.error("❌ Error fetching document:", err);
    }
  });

  socket.on("text_change", async (data) => {
    const { documentName, change, userId } = data;

    socket.to(`doc_${documentName}`).emit("text_change", {
      change,
      userId,
      documentName,
    });

    try {
      await Document.findOneAndUpdate(
        { name: documentName },
        { $set: { content: data.fullContent || "", updatedAt: new Date() } },
        { upsert: true }
      );
    } catch (err) {
      console.error("❌ Error saving document:", err);
    }
  });

  socket.on("cursor_position", (data) => {
    const { documentName, position, userId, username } = data;
    socket.to(`doc_${documentName}`).emit("cursor_position", {
      position,
      userId,
      username,
      documentName,
    });
  });

  socket.on("checklist_change", async (data) => {
    const { documentName, change, userId } = data;

    socket.to(`doc_${documentName}`).emit("checklist_change", {
      change,
      userId,
      documentName,
    });

    try {
      const content = JSON.stringify(change.documents || []);
      await Document.findOneAndUpdate(
        { name: documentName },
        { $set: { content, updatedAt: new Date() } },
        { upsert: true }
      );
    } catch (err) {
      console.error("❌ Error saving checklist:", err);
    }
  });

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
