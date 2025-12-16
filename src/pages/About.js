import React from "react";
import NavbarLeft from "../components/navbar";
import "./About.css";

const About = () => {
  return (
    <>
      <NavbarLeft />
      <div className="static-page-container">
        <div className="static-card">
          <h1>About College Notetakers</h1>
          
          <section className="about-section">
            <h2>Our Mission</h2>
            <p>
              College Notetakers is dedicated to making education more accessible 
              and collaborative. We believe that quality notes and study materials 
              should be available to every student, helping them succeed in their 
              academic journey.
            </p>
          </section>

          <section className="about-section">
            <h2>What We Offer</h2>
            <p>
              Our platform provides a comprehensive suite of tools designed to 
              enhance your learning experience:
            </p>
            <ul>
              <li>
                <strong>Collaborative Note-Taking:</strong> Work together with 
                classmates in real-time to create comprehensive study materials.
              </li>
              <li>
                <strong>Document Sharing:</strong> Upload, organize, and share 
                your notes, PDFs, and study guides with ease.
              </li>
              <li>
                <strong>Study Groups:</strong> Connect with peers through chat 
                rooms and collaborative workspaces.
              </li>
              <li>
                <strong>Personal Library:</strong> Keep all your documents 
                organized and accessible from anywhere.
              </li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Our Story</h2>
            <p>
              As busy college students, we recognize the challenges of staying organized.
              We designed College Notetakers as a tool for students to use in order to 
              stay organized and use as a hub for all their organizational needs. Need to
              share notes with a classmate? Want to collaborate on a group project? In a
              cooking club and wanna share recipes? These are all the ways you can use our 
              app to share notes and stay organized.
            </p>
          </section>

          <section className="about-section">
            <h2>Join Our Community</h2>
            <p>
              Whether you're looking to share your notes, find study partners, or 
              simply stay organized, College Notetakers is here to support your 
              academic success. Join thousands of students who are already 
              transforming the way they learn.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default About;