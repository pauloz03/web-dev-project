// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Main from './pages/mainPage';
import ChatRoom from './pages/ChatRoom';
import Collaborate from './pages/Collaborate';
import CollaborateDocument from './pages/CollaborateDocument';
import InviteFriends from './pages/InviteFriends';
import Documents from './pages/Document';
import Uploads from './pages/uploads';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/main" element={<Main />} />

      <Route path="/chat/:roomName" element={<ChatRoom />} />
      <Route path="/collaborate" element={<Collaborate />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/upload" element={<Uploads />} />
      <Route path="/collaborate/:checklistName/:documentId" element={<CollaborateDocument />} />
      <Route path="/invite" element={<InviteFriends />} />
    </Routes>
  );
}

export default App;
