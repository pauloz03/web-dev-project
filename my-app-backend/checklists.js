import express from "express";
import { Document } from "./model.js";

const router = express.Router();

/**
 * Get checklist (list of documents)
 * GET /checklists/:checklistName
 */
router.get("/:checklistName", async (req, res) => {
  const { checklistName } = req.params;

  try {
    // Try to get checklist from Document collection
    // Store as JSON in content field for now
    const doc = await Document.findOne({ name: checklistName });
    if (!doc) {
      return res.json({ documents: [] });
    }

    // Parse documents array from content
    if (doc.content) {
      try {
        const parsed = JSON.parse(doc.content);
        if (Array.isArray(parsed)) {
          return res.json({ documents: parsed });
        }
      } catch {
        // If not JSON, treat as empty
      }
    }

    res.json({ documents: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Create or update checklist
 * POST /checklists/:checklistName
 */
router.post("/:checklistName", async (req, res) => {
  const { checklistName } = req.params;
  const { documents } = req.body;

  try {
    const content = JSON.stringify(documents || []);
    const doc = await Document.findOneAndUpdate(
      { name: checklistName },
      { 
        content,
        updatedAt: new Date() 
      },
      { upsert: true, new: true }
    );
    res.json({ documents: documents || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


