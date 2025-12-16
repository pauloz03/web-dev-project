import React, { useState } from "react";
import Navbar from "../components/navbar";
import "./ContactUs.css";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    if (formData.name && formData.email && formData.subject && formData.message) {
      console.log("Form submitted:", formData);
      setSubmitted(true);
    
      setTimeout(() => {
        setFormData({ name: "", email: "", subject: "", message: "" });
        setSubmitted(false);
      }, 3000);
    }
  };

  return (
    <>
      <Navbar />
      <div className="static-page-container">
        <div className="static-card">
          <h1>Contact Us</h1>
          <p>
            Have feedback, questions, or ideas? We'd love to hear from you.
          </p>

          {submitted ? (
            <div className="success-message">
              <p>✓ Thank you! Your message has been sent successfully.</p>
            </div>
          ) : (
            <div className="contact-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  className="form-input form-textarea"
                />
              </div>

              <button onClick={handleSubmit} className="submit-button">
                Send Message
              </button>
            </div>
          )}

          <div className="contact-info">
            <p>Or reach us directly:</p>
            <ul>
              <li>
                Email: <a href="mailto:support@collegenotetakers.com">support@collegenotetakers.com</a>
              </li>
              <li>
                GitHub: <a href="https://github.com/" target="_blank" rel="noreferrer">Project Repository</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUs;