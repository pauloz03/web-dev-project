import express from "express";
import { Document } from "./model.js";

const router = express.Router();

/**
 * Get all documents (list of saved checklists)
 * GET /documents
 */
router.get("/", async (req, res) => {
  try {
    const docs = await Document.find({})
      .select("name updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .limit(50); // Limit to 50 most recent
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get user's personal documents
 * GET /documents/personal/:userId
 */
router.get("/personal/:userId", async (req, res) => {
  const { userId } = req.params;
  
  try {
    const docs = await Document.find({
      name: { $regex: `^user_${userId}_` }
    })
      .select("name updatedAt createdAt")
      .sort({ updatedAt: -1 });
    
    // Extract document names (remove the user_${userId}_ prefix)
    // Note: Document names are stored as-is, so we just extract them
    const personalDocs = docs.map(doc => {
      const docName = doc.name.replace(`user_${userId}_`, "");
      return {
        id: docName,
        name: docName,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
      };
    });
    
    res.json(personalDocs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get personal document content
 * GET /documents/personal/:userId/:documentName
 */
router.get("/personal/:userId/:documentName", async (req, res) => {
  const { userId, documentName } = req.params;
  
  try {
    // Express automatically decodes URL params, but handle double encoding
    let decodedName = documentName;
    try {
      decodedName = decodeURIComponent(documentName);
    } catch (e) {
      // Already decoded, use as-is
      decodedName = documentName;
    }
    
    const docName = `user_${userId}_${decodedName}`;
    const doc = await Document.findOne({ name: docName });
    
    if (!doc) {
      return res.json({ content: "", name: decodedName });
    }
    
    res.json({ content: doc.content, name: decodedName });
  } catch (err) {
    console.error("Error fetching personal document:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Create or update personal document
 * POST /documents/personal/:userId/:documentName
 */
router.post("/personal/:userId/:documentName", async (req, res) => {
  const { userId, documentName } = req.params;
  const { content } = req.body;
  
  try {
    // Express automatically decodes URL params, but handle double encoding
    let decodedName = documentName;
    try {
      decodedName = decodeURIComponent(documentName);
    } catch (e) {
      // Already decoded, use as-is
      decodedName = documentName;
    }
    
    const docName = `user_${userId}_${decodedName}`;
    console.log(`Saving document: ${docName}`);
    
    const doc = await Document.findOneAndUpdate(
      { name: docName },
      { 
        content: content || "", 
        updatedAt: new Date() 
      },
      { upsert: true, new: true }
    );
    
    console.log(`Document saved successfully: ${docName}`);
    res.json({ content: doc.content, name: decodedName });
  } catch (err) {
    console.error("Error saving personal document:", err);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

/**
 * Get document content (for specific document within a checklist)
 * GET /documents/:checklistName/:documentId
 */
router.get("/:checklistName/:documentId", async (req, res) => {
  const { checklistName, documentId } = req.params;

  try {
    const docName = `${checklistName}_${documentId}`;
    const doc = await Document.findOne({ name: docName });
    if (!doc) {
      // Create empty document if it doesn't exist
      const newDoc = new Document({ name: docName, content: "" });
      await newDoc.save();
      return res.json({ content: "", name: documentId, id: documentId });
    }
    res.json({ content: doc.content, name: docName, id: documentId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get document content (legacy - for backward compatibility)
 * GET /documents/:documentName
 */
router.get("/:documentName", async (req, res) => {
  const { documentName } = req.params;

  try {
    const doc = await Document.findOne({ name: documentName });
    if (!doc) {
      // Create empty document if it doesn't exist
      const newDoc = new Document({ name: documentName, content: "" });
      await newDoc.save();
      return res.json({ content: "", name: documentName });
    }
    res.json({ content: doc.content, name: doc.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Create or update document (for specific document within a checklist)
 * POST /documents/:checklistName/:documentId
 */
router.post("/:checklistName/:documentId", async (req, res) => {
  const { checklistName, documentId } = req.params;
  const { content, name } = req.body;

  try {
    const docName = `${checklistName}_${documentId}`;
    const doc = await Document.findOneAndUpdate(
      { name: docName },
      { 
        content: content || "", 
        updatedAt: new Date() 
      },
      { upsert: true, new: true }
    );
    res.json({ content: doc.content, name: name || documentId, id: documentId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Create or update document (legacy - for backward compatibility)
 * POST /documents/:documentName
 */
router.post("/:documentName", async (req, res) => {
  const { documentName } = req.params;
  const { content } = req.body;

  try {
    const doc = await Document.findOneAndUpdate(
      { name: documentName },
      { content: content || "", updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ content: doc.content, name: doc.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;