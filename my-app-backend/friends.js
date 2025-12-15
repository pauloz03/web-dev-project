import express from "express";
import { createClient } from "@supabase/supabase-js";
import { FriendRequest } from "./model.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Initialize Supabase Admin client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

/**
 * Search for user by email
 * GET /friends/search?email=user@example.com
 */
router.get("/search", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase config:", { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey 
      });
      return res.status(500).json({
        message: "Supabase configuration missing. Please add SUPABASE_URL and SUPABASE_SERVICE_KEY to your backend .env file",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ 
        message: `Error searching for user: ${error.message || "Supabase API error"}` 
      });
    }

    const user = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ 
      message: `Error searching for user: ${err.message || "Unknown error"}` 
    });
  }
});

/**
 * Send friend request
 * POST /friends/request
 * Body: { receiverEmail, senderId, senderEmail }
 */
router.post("/request", async (req, res) => {
  const { receiverEmail, senderId, senderEmail } = req.body;

  if (!receiverEmail || !senderId || !senderEmail) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Don't allow sending friend request to yourself
  if (senderEmail.toLowerCase() === receiverEmail.toLowerCase()) {
    return res.status(400).json({ message: "Cannot send friend request to yourself" });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase config:", { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey 
      });
      return res.status(500).json({
        message: "Supabase configuration missing. Please add SUPABASE_URL and SUPABASE_SERVICE_KEY to your backend .env file",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ 
        message: `Error searching for user: ${error.message || "Supabase API error"}` 
      });
    }

    const receiver = data.users.find(
      (u) => u.email?.toLowerCase() === receiverEmail.toLowerCase()
    );

    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId: receiver.id },
        { senderId: receiver.id, receiverId: senderId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return res.status(400).json({
          message: "Friend request already exists",
          request: existingRequest,
        });
      }
      if (existingRequest.status === "accepted") {
        return res.status(400).json({
          message: "You are already friends with this user",
        });
      }
    }

    // Create new friend request
    const friendRequest = new FriendRequest({
      senderId,
      senderEmail,
      receiverId: receiver.id,
      receiverEmail: receiver.email,
      status: "pending",
    });

    await friendRequest.save();

    res.json({
      message: "Friend request sent successfully",
      request: friendRequest,
    });
  } catch (err) {
    console.error("Error sending friend request:", err);
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Friend request already exists",
      });
    }
    res.status(500).json({ message: "Error sending friend request" });
  }
});

/**
 * Get friend requests for a user
 * GET /friends/requests?userId=xxx&type=sent|received|all
 */
router.get("/requests", async (req, res) => {
  const { userId, type = "all" } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    let query = {};

    if (type === "sent") {
      query = { senderId: userId };
    } else if (type === "received") {
      query = { receiverId: userId, status: "pending" };
    } else {
      query = {
        $or: [{ senderId: userId }, { receiverId: userId }],
      };
    }

    const requests = await FriendRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ requests });
  } catch (err) {
    console.error("Error fetching friend requests:", err);
    res.status(500).json({ message: "Error fetching friend requests" });
  }
});

/**
 * Accept friend request
 * POST /friends/accept
 * Body: { requestId, userId }
 */
router.post("/accept", async (req, res) => {
  const { requestId, userId } = req.body;

  if (!requestId || !userId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (request.receiverId !== userId) {
      return res.status(403).json({
        message: "You can only accept requests sent to you",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: `Friend request is already ${request.status}`,
      });
    }

    request.status = "accepted";
    await request.save();

    res.json({
      message: "Friend request accepted",
      request,
    });
  } catch (err) {
    console.error("Error accepting friend request:", err);
    res.status(500).json({ message: "Error accepting friend request" });
  }
});

/**
 * Reject friend request
 * POST /friends/reject
 * Body: { requestId, userId }
 */
router.post("/reject", async (req, res) => {
  const { requestId, userId } = req.body;

  if (!requestId || !userId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (request.receiverId !== userId) {
      return res.status(403).json({
        message: "You can only reject requests sent to you",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: `Friend request is already ${request.status}`,
      });
    }

    request.status = "rejected";
    await request.save();

    res.json({
      message: "Friend request rejected",
      request,
    });
  } catch (err) {
    console.error("Error rejecting friend request:", err);
    res.status(500).json({ message: "Error rejecting friend request" });
  }
});

/**
 * Get friends list
 * GET /friends/list?userId=xxx
 */
router.get("/list", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const acceptedRequests = await FriendRequest.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      status: "accepted",
    }).lean();

    // Get friend IDs and emails
    const friendIds = new Set();
    const friends = [];

    for (const request of acceptedRequests) {
      const friendId =
        request.senderId === userId ? request.receiverId : request.senderId;
      const friendEmail =
        request.senderId === userId
          ? request.receiverEmail
          : request.senderEmail;

      if (!friendIds.has(friendId)) {
        friendIds.add(friendId);
        friends.push({
          id: friendId,
          email: friendEmail,
          friendshipDate: request.updatedAt,
        });
      }
    }

    res.json({ friends });
  } catch (err) {
    console.error("Error fetching friends list:", err);
    res.status(500).json({ message: "Error fetching friends list" });
  }
});

export default router;

