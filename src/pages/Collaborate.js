import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import NavbarLeft from "../components/navbar2.js";
import "./Collaborate.css";

const BACKEND_URL = "http://localhost:5001";


const Collaborate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [documentName, setDocumentName] = useState("");
  const [documents, setDocuments] = useState([]);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [username, setUsername] = useState("Anonymous");
  const [isEditing, setIsEditing] = useState(false);
  const [socket, setSocket] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [savedChecklists, setSavedChecklists] = useState([]);
  const [showSavedList, setShowSavedList] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const inputRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Check for checklist parameter from invitation link
  useEffect(() => {
    const checklistParam = searchParams.get("checklist");
    if (checklistParam && !isEditing) {
      setDocumentName(checklistParam);
      setShowSavedList(false);
    }
  }, [searchParams, isEditing]);

  // Fetch saved checklists when not editing
  useEffect(() => {
    if (isEditing) return;

    const fetchSavedChecklists = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/documents`);
        const data = await res.json();
        setSavedChecklists(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching saved checklists:", err);
      }
    };

    fetchSavedChecklists();
  }, [isEditing]);

  // Join document when user enters document name
  const handleJoinDocument = () => {
    if (!documentName.trim() || !socket) return;
    
    setIsEditing(true);
    socket.emit("join_document", documentName.trim());
  };

  // Fetch initial checklist (list of documents)
  useEffect(() => {
    if (!documentName.trim() || !isEditing) return;

    const fetchChecklist = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/checklists/${documentName}`);
        const data = await res.json();
        // Checklists contain an array of documents
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
      } catch (err) {
        console.error("Error fetching checklist:", err);
        // If endpoint doesn't exist yet, try old format
        try {
          const res = await fetch(`${BACKEND_URL}/documents/${documentName}`);
          const data = await res.json();
          if (data.content) {
            const parsed = JSON.parse(data.content);
            // Convert old items format to documents format
            if (Array.isArray(parsed)) {
              setDocuments(parsed.map(item => ({
                id: item.id || Date.now().toString(),
                name: item.text || item.name || "Untitled Document",
                content: "",
                createdAt: item.createdAt || new Date().toISOString(),
                addedBy: item.addedBy || "Unknown"
              })));
            }
          }
        } catch (e) {
          setDocuments([]);
        }
      }
    };
    fetchChecklist();
  }, [documentName, isEditing]);

  // Listen for checklist updates from server
  useEffect(() => {
    if (!socket) return;

    const handleChecklistUpdate = ({ documents: updatedDocs, documentName: docName }) => {
      if (docName === documentName && Array.isArray(updatedDocs)) {
        setDocuments(updatedDocs);
      }
    };

    socket.on("checklist_update", handleChecklistUpdate);

    return () => {
      socket.off("checklist_update", handleChecklistUpdate);
    };
  }, [socket, documentName]);

  // Listen for checklist changes from other users
  useEffect(() => {
    if (!socket) return;

    const handleChecklistChange = ({ change, userId, documentName: docName }) => {
      if (docName !== documentName || userId === socket.id) return;

      // Update documents based on change type
      if (change && change.documents) {
        setDocuments(change.documents);
      }
    };

    socket.on("checklist_change", handleChecklistChange);

    return () => {
      socket.off("checklist_change", handleChecklistChange);
    };
  }, [socket, documentName]);

  // Sync checklist to server
  const syncChecklist = async (updatedDocuments) => {
    if (!documentName) return;
    
    // Try socket first (for real-time sync)
    if (socket && socket.connected) {
      socket.emit("checklist_change", {
        documentName,
        change: {
          documents: updatedDocuments,
        },
        userId: socket.id,
      });
    }
    
    // Also save directly via HTTP as backup
    try {
      const response = await fetch(`${BACKEND_URL}/checklists/${documentName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documents: updatedDocuments }),
      });
      
      if (response.ok) {
        setLastSaved(new Date());
        console.log("Checklist saved successfully");
      } else {
        console.error("Failed to save checklist:", response.status);
      }
    } catch (err) {
      console.error("Error saving checklist:", err);
    }
  };

  // Add new document to checklist
  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!newDocumentName.trim()) return;

    const newDocument = {
      id: Date.now().toString(),
      name: newDocumentName.trim(),
      content: "",
      createdAt: new Date().toISOString(),
      addedBy: username || "Anonymous",
    };

    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
    setNewDocumentName("");
    syncChecklist(updatedDocuments);

    // Also create the document in backend
    try {
      await fetch(`${BACKEND_URL}/documents/${documentName}/${newDocument.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: newDocument.name,
          content: "" 
        }),
      });
    } catch (err) {
      console.error("Error creating document:", err);
    }
  };

  // Delete document
  const handleDeleteDocument = (documentId) => {
    const updatedDocuments = documents.filter((doc) => doc.id !== documentId);
    setDocuments(updatedDocuments);
    syncChecklist(updatedDocuments);
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target);
    // Find the parent checklist item and set opacity
    const itemElement = e.target.closest(".checklist-item");
    if (itemElement) {
      setTimeout(() => {
        itemElement.style.opacity = "0.5";
      }, 0);
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      // Reset opacity
      const items = document.querySelectorAll(".checklist-item");
      items.forEach((item) => (item.style.opacity = "1"));
      return;
    }

    const newDocuments = [...documents];
    const draggedDoc = newDocuments[draggedItem];
    
    // Remove dragged document from its position
    newDocuments.splice(draggedItem, 1);
    
    // Insert at new position
    newDocuments.splice(dropIndex, 0, draggedDoc);
    
    setDocuments(newDocuments);
    syncChecklist(newDocuments);
    
    // Reset drag state
    setDraggedItem(null);
    setDragOverIndex(null);
    
    // Reset opacity
    const itemElements = document.querySelectorAll(".checklist-item");
    itemElements.forEach((item) => (item.style.opacity = "1"));
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    // Reset opacity
    const docs = document.querySelectorAll(".checklist-item");
    docs.forEach((doc) => (doc.style.opacity = "1"));
  };

  // Leave checklist
  const handleLeave = async () => {
    // Final save before leaving (even if empty, to ensure it's saved)
    if (documentName) {
      await syncChecklist(documents);
    }
    
    if (socket && documentName) {
      socket.emit("leave_document", documentName);
    }
    
    setIsEditing(false);
    setDocumentName("");
    setDocuments([]);
    setNewDocumentName("");
    // Refresh saved checklists list
    setShowSavedList(true);
  };

  // Load a saved checklist
  const handleLoadChecklist = (name) => {
    setDocumentName(name);
    setShowSavedList(false);
    setTimeout(() => {
      setIsEditing(true);
      if (socket) {
        socket.emit("join_document", name);
      }
    }, 100);
  };

  return (
    <>
      <NavbarLeft />
      <div className="collaborate-container">
        {!isEditing ? (
          // Checklist selection/creation view
          <div className="document-selector">
            <h2>Collaborative Checklist</h2>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter checklist name..."
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleJoinDocument()}
              />
              <button onClick={handleJoinDocument} className="join-btn">
                Open/Create Checklist
              </button>
            </div>
            <input
              type="text"
              className="username-input"
              placeholder="Enter your name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            {/* Saved Checklists List */}
            {savedChecklists.length > 0 && (
              <div className="saved-checklists">
                <div className="saved-checklists-header">
                  <h3>Saved Checklists</h3>
                  <button
                    className="toggle-saved-btn"
                    onClick={() => setShowSavedList(!showSavedList)}
                  >
                    {showSavedList ? "Hide" : "Show"} ({savedChecklists.length})
                  </button>
                </div>
                {showSavedList && (
                  <div className="saved-checklists-list">
                    {savedChecklists.map((checklist) => (
                      <div
                        key={checklist._id || checklist.name}
                        className="saved-checklist-item"
                        onClick={() => handleLoadChecklist(checklist.name)}
                      >
                        <span className="checklist-name">{checklist.name}</span>
                        <span className="checklist-date">
                          {checklist.updatedAt
                            ? new Date(checklist.updatedAt).toLocaleDateString()
                            : "Recently updated"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Checklist view
          <div className="editor-container">
            <div className="editor-header">
              <h3>Checklist: {documentName}</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
              Click on a document to edit it
            </p>
              <div className="header-actions">
                <span className="username-display">{username}</span>
                <button onClick={handleLeave} className="leave-btn">
                  Leave
                </button>
              </div>
            </div>

            <div className="checklist-wrapper">
              <form onSubmit={handleAddDocument} className="add-item-form">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Add new document..."
                  value={newDocumentName}
                  onChange={(e) => setNewDocumentName(e.target.value)}
                  className="add-item-input"
                />
                <button type="submit" className="add-item-btn">
                  Add Document
                </button>
              </form>

              <div className="checklist-items">
                {documents.length === 0 ? (
                  <p className="no-items">No documents yet. Add your first document above!</p>
                ) : (
                  documents.map((doc, index) => (
                    <div
                      key={doc.id}
                      className={`checklist-item document-item ${
                        dragOverIndex === index ? "drag-over" : ""
                      } ${draggedItem === index ? "dragging" : ""}`}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <span
                        className="drag-handle"
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        aria-label="Drag to reorder"
                      >
                        ⋮⋮
                      </span>
                      <div 
                        className="document-content-wrapper"
                        onClick={() => navigate(`/collaborate/${documentName}/${doc.id}`)}
                      >
                        <h4 className="document-name">{doc.name}</h4>
                        {doc.addedBy && (
                          <span className="item-added-by">
                            added by: {doc.addedBy}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc.id);
                        }}
                        className="delete-item-btn"
                        aria-label="Delete document"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {documents.length > 0 && (
                <div className="checklist-stats">
                  <span>
                    {documents.length} document{documents.length !== 1 ? 's' : ''} in this checklist
                  </span>
                </div>
              )}
            </div>

            <div className="editor-footer">
              <p className="sync-indicator">
                <span className="sync-dot"></span>
                {lastSaved 
                  ? `Saved ${new Date(lastSaved).toLocaleTimeString()}`
                  : "Syncing in real-time"}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Collaborate;

