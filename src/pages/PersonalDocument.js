import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarLeft from "../components/navbar2.js";
import { useAuth } from "../contexts/AuthContext";
import "./CollaborateDocument.css";

const BACKEND_URL = "https://web-dev-project-1-blo3.onrender.com";

const PersonalDocument = () => {
  const { documentName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Fetch document content
  useEffect(() => {
    if (!documentName || !user?.id) return;

    const fetchDocument = async () => {
      try {
        // documentName from URL params is already decoded by React Router
        // But we need to encode it for the fetch URL
        const encodedName = encodeURIComponent(documentName);
        const res = await fetch(`${BACKEND_URL}/documents/personal/${user.id}/${encodedName}`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch document: ${res.status}`);
        }
        
        const data = await res.json();
        setContent(data.content || "");
      } catch (err) {
        console.error("Error fetching document:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [documentName, user?.id]);

  // Handle text changes with debounce
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Debounce: save after user stops typing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (user?.id && documentName) {
        // documentName from URL params is already decoded by React Router
        // Encode it for the fetch URL
        const encodedName = encodeURIComponent(documentName);
        fetch(`${BACKEND_URL}/documents/personal/${user.id}/${encodedName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newContent }),
        })
          .then((res) => {
            if (!res.ok) {
              return res.json().then((data) => {
                throw new Error(data.message || "Failed to save");
              });
            }
            return res.json();
          })
          .then((data) => {
            console.log("Document saved successfully:", data);
          })
          .catch((err) => {
            console.error("Error saving document:", err);
          });
      }
    }, 300);
  };

  if (loading) {
    return (
      <>
        <NavbarLeft />
        <div className="document-editor-container">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarLeft />
      <div className="document-editor-container">
        <div className="document-header">
          <div className="header-left">
            <button onClick={() => navigate(`/documents`)} className="back-btn">
              ← Back to My Documents
            </button>
            <h2>{decodeURIComponent(documentName)}</h2>
          </div>
        </div>

        <div className="editor-wrapper">
          <textarea
            ref={textareaRef}
            className="document-textarea"
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing your notes..."
            spellCheck={true}
          />
        </div>

        <div className="document-footer">
          <p className="sync-indicator">
            <span className="sync-dot"></span>
            Auto-saving...
          </p>
        </div>
      </div>
    </>
  );
};

export default PersonalDocument;

