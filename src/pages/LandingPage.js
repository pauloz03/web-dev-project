import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import Navbar from "../components/navbar.js"

function LandingPage() {
  return (
    <>
    <Navbar />
    <div className="landing-container">
      <div className="landing-content">
        <h1 className="landing-title">College Notetakers</h1>
        <div className="landing-buttons">
          <Link to="/login" className="btn primary">Login</Link>
          <Link to="/signup" className="btn outline">Sign Up</Link>
        </div>
      </div>
    </div>
    </>
  );
}

export default LandingPage;
