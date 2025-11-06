import React from "react";
import NavbarLeft from "../components/navbar2.js";
import "./Document.css";

const Documents = () => {
  return (
    <>
      <NavbarLeft />
      <div className="documents-container">
        <div className="documents-panel">
          <h2>No documents at the moment</h2>
          <p>Try uploading one to get started!</p>
          <button 
            className="upload-btn"
            onClick={() => alert("Upload feature coming soon!")}
          >
            Upload Document
          </button>
        </div>
      </div>
    </>
  );
};

export default Documents;

