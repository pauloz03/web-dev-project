import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import NavbarLeft from "../components/navbar2.js";
import "./CollaborateDocument.css";

const BACKEND_URL = "http://localhost:5001";

const CollaborateDocument = () => {
  const { checklistName, documentId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [username, setUsername] = useState("Anonymous");
  const [socket, setSocket] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const textareaRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch document content
  useEffect(() => {
    if (!documentId || !checklistName) return;

    const fetchDocument = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/documents/${checklistName}/${documentId}`);
        const data = await res.json();
        setContent(data.content || "");
        // Try to get the actual document name from the checklist
        try {
          const checklistRes = await fetch(`${BACKEND_URL}/checklists/${checklistName}`);
          const checklistData = await checklistRes.json();
          if (checklistData.documents) {
            const doc = checklistData.documents.find(d => d.id === documentId);
            if (doc) {
              setDocumentName(doc.name || documentId);
            } else {
              setDocumentName(documentId);
            }
          } else {
            setDocumentName(documentId);
          }
        } catch {
          setDocumentName(documentId);
        }
      } catch (err) {
        console.error("Error fetching document:", err);
      }
    };
    fetchDocument();
  }, [documentId, checklistName]);

  // Join document room
  useEffect(() => {
    if (!socket || !documentId || !checklistName) return;

    const roomName = `${checklistName}_${documentId}`;
    socket.emit("join_document", roomName);

    // Listen for document content
    const handleDocumentContent = ({ content: docContent }) => {
      setContent(docContent || "");
    };

    socket.on("document_content", handleDocumentContent);

    // Listen for text changes from other users
    const handleTextChange = ({ change, userId }) => {
      if (userId === socket.id) return;
      if (change && change.fullContent !== undefined) {
        setContent(change.fullContent);
      }
    };

    socket.on("text_change", handleTextChange);

    return () => {
      socket.off("document_content", handleDocumentContent);
      socket.off("text_change", handleTextChange);
      socket.emit("leave_document", roomName);
    };
  }, [socket, documentId, checklistName]);

  // Handle text changes
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Debounce: send changes after user stops typing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (socket && documentId && checklistName) {
        const roomName = `${checklistName}_${documentId}`;
        socket.emit("text_change", {
          documentName: roomName,
          change: {
            fullContent: newContent,
          },
          fullContent: newContent,
          userId: socket.id,
        });

        // Also save via HTTP
        fetch(`${BACKEND_URL}/documents/${checklistName}/${documentId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newContent }),
        }).catch((err) => console.error("Error saving:", err));
      }
    }, 300);
  };

  return (
    <>
      <NavbarLeft />
      <div className="document-editor-container">
        <div className="document-header">
          <div className="header-left">
            <button onClick={() => navigate(`/collaborate`)} className="back-btn">
              ← Back to Checklist
            </button>
            <h2>{documentName || documentId}</h2>
          </div>
          <div className="header-right">
            <input
              type="text"
              className="username-input"
              placeholder="Your name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="editor-wrapper">
          <textarea
            ref={textareaRef}
            className="document-textarea"
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing... Changes will sync in real-time!"
            spellCheck={true}
          />
        </div>

        <div className="document-footer">
          <p className="sync-indicator">
            <span className="sync-dot"></span>
            Syncing in real-time
          </p>
        </div>
      </div>
    </>
  );
};

export default CollaborateDocument;

