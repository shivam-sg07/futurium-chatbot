import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IdleScreen from './components/IdleScreen';
import GetStartedScreen from './components/GetStartedScreen';
import ChatScreen from './components/ChatScreen';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IdleScreen />} />
        <Route path="/get-started" element={<GetStartedScreen />} />
        <Route path="/chat" element={<ChatScreen />} />
      </Routes>
    </Router>
  );
}

export default App;