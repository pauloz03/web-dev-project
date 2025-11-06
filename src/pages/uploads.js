import React from "react";
import NavbarLeft from "../components/navbar2.js";
import "./uploads.css";

const Uploads = () => {
  return (
    <>
      <NavbarLeft />
      <div className="uploads-container">
        <div className="uploads-panel">
          <h2>Upload your files</h2>
          <p>Choose to upload a document or a folder of documents.</p>
          <div className="button-group">
            <button
              className="upload-btn"
              onClick={() => alert("Upload document feature coming soon!")}
            >
              Upload Document
            </button>
            <button
              className="upload-btn"
              onClick={() => alert("Upload folder feature coming soon!")}
            >
              Upload Folder of Documents
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Uploads;
