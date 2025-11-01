import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import Navbar from "../components/navbar.js";

function LandingPage() {
  return (
    <>
      <Navbar />
      <div 
        className="landing-container"
        style={{
          backgroundImage: `linear-gradient(rgba(10, 29, 77, 0.7), rgba(10, 29, 77, 0.7)), url(${process.env.PUBLIC_URL}/background.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
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
