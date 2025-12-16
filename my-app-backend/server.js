// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import chatRouter from "./chat.js";
import documentsRouter from "./documents.js";
import checklistsRouter from "./checklists.js";
import invitationsRouter from "./invitations.js";
import friendsRouter from "./friends.js";
import Room, { Document } from "./model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "https://web-dev-project-murex.vercel.app",
  "https://web-dev-project-hmxybrzup-pauloz03s-projects.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for this origin"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// API routes
app.use("/chat", chatRouter);
app.use("/documents", documentsRouter);
app.use("/checklists", checklistsRouter);
app.use("/invitations", invitationsRouter);
app.use("/friends", friendsRouter);

// Serve frontend if built
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildPath = path.join(__dirname, "../my-app/build");
app.use(express.static(buildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// Socket.IO with same CORS rules
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 New user connected:", socket.id);

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
  });

  socket.on("send_message", async (data) => {
    const messageObj = {
      authorUsername: data.authorUsername || "Anonymous",
      content: data.content || "",
      createdAt: new Date(),
    };

    io.to(data.room).emit("receive_message", { ...messageObj, room: data.room });

    try {
      if (!data.room) return;
      let room = await Room.findOne({ name: data.room });
      if (!room) room = new Room({ name: data.room, messages: [] });

      room.messages.push(messageObj);
      await room.save();
    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  socket.on("join_document", async (documentName) => {
    socket.join(`doc_${documentName}`);
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
    socket.to(`doc_${data.documentName}`).emit("text_change", data);
    try {
      await Document.findOneAndUpdate(
        { name: data.documentName },
        { content: data.fullContent || "", updatedAt: new Date() },
        { upsert: true }
      );
    } catch (err) {
      console.error("❌ Error saving document:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
