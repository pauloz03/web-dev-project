import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import '../App.css';

export default function NavbarLeft() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hamburger button */}
      <div className={`hamburger ${isOpen ? "open" : ""}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Vertical menu */}
      <nav className={`vertical-menu ${isOpen ? "open" : ""}`}>
        <ul>
          <li>
            <NavLink to="/documents" onClick={() => setIsOpen(false)}>My Documents</NavLink>
          </li>
          <li>
            <NavLink to="/main" onClick={() => setIsOpen(false)}>Classroom</NavLink>
          </li>
          <li>
            <NavLink to="/collaborate" onClick={() => setIsOpen(false)}>Collaborate</NavLink>
          </li>
          <li>
            <NavLink to="/upload" onClick={() => setIsOpen(false)}>Upload</NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
}
