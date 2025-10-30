import express from "express";
import Room from "./model.js";

const router = express.Router();

/**
 * Get all messages in a room
 * GET /chat/:roomName
 */
router.get("/:roomName", async (req, res) => {
  const { roomName } = req.params;

  try {
    const room = await Room.findOne({ name: roomName });
    if (!room) return res.status(404).json({ message: "Room not found" });

    res.json(Array.isArray(room.messages) ? room.messages : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ No POST route needed; socket handles sending messages

export default router;
