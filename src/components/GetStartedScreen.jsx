import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function GetStartedScreen() {
  const iframeRef = useRef(null);
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate('/chat');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <iframe
        ref={iframeRef}
        src="/unity/get-started.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title="Get Started"
      />
      <button 
        onClick={handleStartChat}
        style={{
          position: 'absolute',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '15px 30px',
          fontSize: '18px',
          cursor: 'pointer',
          zIndex: 10,
          backgroundColor: 'transparent',
          color: 'transparent',
          border: 'none',
          borderRadius: '5px',
          opacity: 0
        }}
      >
        Start Feedback
      </button>
    </div>
  );
}

export default GetStartedScreen;