import express from "express";
import Room from "./model.js";

const router = express.Router(); // unlike "express()" which creates an app, "express.Router()" creates a mini-app or sub-router
// It’s not a full server, but a modular way to handle groups of routes.

/**
 * Get all messages in a room
 * GET /chat/:roomName
 */
router.get("/:roomName", async (req, res) => {
  const { roomName } = req.params;

  try {
    const room = await Room.findOne({ name: roomName });
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Ensure messages is always an array
    res.json(Array.isArray(room.messages) ? room.messages : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Send a message
 * POST /chat/:roomName
 * Body: { authorUsername, content }
 */
router.post("/:roomName", async (req, res) => {
  const { roomName } = req.params;
  const { authorUsername, content } = req.body;

  if (!authorUsername || !content)
    return res.status(400).json({ message: "Missing fields" });

  try {
    let room = await Room.findOne({ name: roomName });

    if (!room) {
      // Create room if it doesn't exist
      room = new Room({ name: roomName, messages: [] });
    }

    // Add message
    room.messages.push({ authorUsername, content });
    await room.save();

    // Return updated messages array
    res.status(201).json({ message: "Message sent", messages: room.messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
