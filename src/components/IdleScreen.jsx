import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function IdleScreen() {
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  const handleGetStarted = () => {
    navigate('/get-started');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <iframe
        ref={iframeRef}
        src="/unity/idle-mode.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title="Idle Mode"
      />
      <button 
        onClick={handleGetStarted}
        style={{
          position: 'absolute',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '15px 30px',
          fontSize: '18px',
          cursor: 'pointer',
          zIndex: 10,
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        Get Started
      </button>
    </div>
  );
}

export default IdleScreen;