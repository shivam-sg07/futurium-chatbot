import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IdleScreen from './components/IdleScreen';
import ChatScreen from './components/ChatScreen';
import ThankYouScreen from './components/ThankYouScreen';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IdleScreen />} />
        <Route path="/chat" element={<ChatScreen />} />
        <Route path="/thank-you" element={<ThankYouScreen />} />
      </Routes>
    </Router>
  );
}

export default App;