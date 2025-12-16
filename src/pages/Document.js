import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarLeft from "../components/navbar2.js";
import { useAuth } from "../contexts/AuthContext";
import "./Document.css";

const BACKEND_URL = "https://web-dev-project-1-blo3.onrender.com";

const Documents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch user's personal documents
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/documents/personal/${user.id}`);
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching documents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user?.id]);

  // Create new document
  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!newDocumentName.trim() || !user?.id) return;

    const documentName = encodeURIComponent(newDocumentName.trim());
    
    // Navigate to the document editor (it will create it if it doesn't exist)
    navigate(`/documents/personal/${documentName}`);
    setNewDocumentName("");
  };

  // Open document
  const handleOpenDocument = (docName) => {
    const encodedName = encodeURIComponent(docName);
    navigate(`/documents/personal/${encodedName}`);
  };

  if (loading) {
    return (
      <>
        <NavbarLeft />
        <div className="documents-container">
          <div className="documents-panel">
            <p>Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarLeft />
      <div className="documents-container">
        <div className="documents-panel">
          <h2>My Documents</h2>
          
          <form onSubmit={handleCreateDocument} className="create-document-form">
            <input
              type="text"
              placeholder="Enter document name..."
              value={newDocumentName}
              onChange={(e) => setNewDocumentName(e.target.value)}
              className="document-name-input"
            />
            <button type="submit" className="create-btn">
              Create Document
            </button>
          </form>

          {documents.length > 0 ? (
            <div className="documents-list">
              <h3>Your Documents ({documents.length})</h3>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="document-item"
                  onClick={() => handleOpenDocument(doc.name)}
                >
                  <div className="document-info">
                    <h4>{doc.name}</h4>
                    <p className="document-date">
                      {doc.updatedAt
                        ? `Updated ${new Date(doc.updatedAt).toLocaleDateString()}`
                        : `Created ${new Date(doc.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-documents">No documents yet. Create your first document above!</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Documents;

