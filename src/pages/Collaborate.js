import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import io from "socket.io-client";
import NavbarLeft from "../components/navbar2.js";
import "./Collaborate.css";

const BACKEND_URL = "http://localhost:5001";

const Collaborate = () => {
  const [searchParams] = useSearchParams();
  const [documentName, setDocumentName] = useState("");
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState("");
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

  // Fetch initial checklist
  useEffect(() => {
    if (!documentName.trim() || !isEditing) return;

    const fetchChecklist = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/documents/${documentName}`);
        const data = await res.json();
        // Parse JSON if content exists, otherwise empty array
        if (data.content) {
          try {
            const parsed = JSON.parse(data.content);
            setItems(Array.isArray(parsed) ? parsed : []);
          } catch {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Error fetching checklist:", err);
      }
    };
    fetchChecklist();
  }, [documentName, isEditing]);

  // Listen for checklist content from server
  useEffect(() => {
    if (!socket) return;

    const handleDocumentContent = ({ content: docContent, documentName: docName }) => {
      if (docName === documentName) {
        if (docContent) {
          try {
            const parsed = JSON.parse(docContent);
            setItems(Array.isArray(parsed) ? parsed : []);
          } catch {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      }
    };

    socket.on("document_content", handleDocumentContent);

    return () => {
      socket.off("document_content", handleDocumentContent);
    };
  }, [socket, documentName]);

  // Listen for checklist changes from other users
  useEffect(() => {
    if (!socket) return;

    const handleChecklistChange = ({ change, userId, documentName: docName }) => {
      if (docName !== documentName || userId === socket.id) return;

      // Update items based on change type
      if (change && change.items) {
        setItems(change.items);
      }
    };

    socket.on("text_change", handleChecklistChange);

    return () => {
      socket.off("text_change", handleChecklistChange);
    };
  }, [socket, documentName]);

  // Sync checklist to server
  const syncChecklist = async (updatedItems) => {
    if (!documentName) return;
    
    const content = JSON.stringify(updatedItems);
    
    // Try socket first (for real-time sync)
    if (socket && socket.connected) {
      socket.emit("text_change", {
        documentName,
        change: {
          items: updatedItems,
        },
        fullContent: content,
        userId: socket.id,
      });
    }
    
    // Also save directly via HTTP as backup
    try {
      const response = await fetch(`${BACKEND_URL}/documents/${documentName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      
      if (response.ok) {
        setLastSaved(new Date());
        console.log("✅ Checklist saved successfully");
      } else {
        console.error("❌ Failed to save checklist:", response.status);
      }
    } catch (err) {
      console.error("❌ Error saving checklist:", err);
    }
  };

  // Add new item
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      addedBy: username || "Anonymous",
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    setNewItemText("");
    syncChecklist(updatedItems);
  };

  // Toggle item completion
  const handleToggleItem = (itemId) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setItems(updatedItems);
    syncChecklist(updatedItems);
  };

  // Update item text
  const handleUpdateItemText = (itemId, newText) => {
    if (!newText.trim()) {
      handleDeleteItem(itemId);
      return;
    }

    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, text: newText.trim() } : item
    );
    setItems(updatedItems);
    syncChecklist(updatedItems);
  };

  // Delete item
  const handleDeleteItem = (itemId) => {
    const updatedItems = items.filter((item) => item.id !== itemId);
    setItems(updatedItems);
    syncChecklist(updatedItems);
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

    const newItems = [...items];
    const draggedItemData = newItems[draggedItem];
    
    // Remove dragged item from its position
    newItems.splice(draggedItem, 1);
    
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedItemData);
    
    setItems(newItems);
    syncChecklist(newItems);
    
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
    const items = document.querySelectorAll(".checklist-item");
    items.forEach((item) => (item.style.opacity = "1"));
  };

  // Leave document
  const handleLeave = async () => {
    // Final save before leaving (even if empty, to ensure it's saved)
    if (documentName) {
      await syncChecklist(items);
    }
    
    if (socket && documentName) {
      socket.emit("leave_document", documentName);
    }
    
    setIsEditing(false);
    setDocumentName("");
    setItems([]);
    setNewItemText("");
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
              <div className="header-actions">
                <span className="username-display">{username}</span>
                <button onClick={handleLeave} className="leave-btn">
                  Leave
                </button>
              </div>
            </div>

            <div className="checklist-wrapper">
              <form onSubmit={handleAddItem} className="add-item-form">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Add new item..."
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  className="add-item-input"
                />
                <button type="submit" className="add-item-btn">
                  Add
                </button>
              </form>

              <div className="checklist-items">
                {items.length === 0 ? (
                  <p className="no-items">No items yet. Add your first item above!</p>
                ) : (
                  items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`checklist-item ${
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
                      <input
                        type="checkbox"
                        checked={item.completed || false}
                        onChange={() => handleToggleItem(item.id)}
                        className="item-checkbox"
                      />
                      <div className="item-content-wrapper">
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
                          onBlur={(e) => {
                            if (!e.target.value.trim()) {
                              handleDeleteItem(item.id);
                            }
                          }}
                          className={`item-text ${item.completed ? "completed" : ""}`}
                        />
                        {item.addedBy && (
                          <span className="item-added-by">
                            added by: {item.addedBy}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="delete-item-btn"
                        aria-label="Delete item"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="checklist-stats">
                  <span>
                    {items.filter((item) => item.completed).length} of {items.length} completed
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

