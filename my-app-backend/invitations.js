import express from "express";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();


const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Initialize Supabase Admin client (for searching users)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Admin key for server-side operations

// Initialize email transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Search for user by email
 * GET /search?email=user@example.com
 */
router.get("/search", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        message: "Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env" 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Search for user by email in Supabase auth
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Error searching for user" });
    }

    // Find user by email
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Error searching for user" });
  }
});

/**
 * Send invitation email
 * POST /invitations/send
 */
router.post("/invitations/send", async (req, res) => {
  const { recipientEmail, recipientId, checklistName, senderEmail, senderId } = req.body;

  if (!recipientEmail || !checklistName || !senderEmail) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn("⚠️ Email not configured. Invitation would be sent to:", recipientEmail);
      // Log the invitation link for development
      return res.json({
        message: "Invitation logged (email not configured)",
        invitation: {
          recipientEmail,
          checklistName,
          senderEmail,
          link: `${FRONTEND_URL}/collaborate?checklist=${encodeURIComponent(checklistName)}`,
        },
      });
    }

    // Create invitation link
    const invitationLink = `${FRONTEND_URL}/collaborate?checklist=${encodeURIComponent(checklistName)}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `${senderEmail} invited you to collaborate on "${checklistName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Checklist Collaboration Invitation</h2>
          <p><strong>${senderEmail}</strong> has invited you to collaborate on the checklist:</p>
          <h3 style="color: #007bff;">${checklistName}</h3>
          <p>Click the button below to join the checklist:</p>
          <a href="${invitationLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Join Checklist
          </a>
          <p style="color: #666; font-size: 12px;">
            Or copy and paste this link into your browser:<br>
            ${invitationLink}
          </p>
        </div>
      `,
      text: `
        ${senderEmail} has invited you to collaborate on the checklist: ${checklistName}
        
        Join the checklist: ${invitationLink}
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      message: "Invitation sent successfully",
      recipientEmail,
    });
  } catch (err) {
    console.error("Error sending invitation:", err);
    res.status(500).json({ message: "Error sending invitation email" });
  }
});

export default router;
