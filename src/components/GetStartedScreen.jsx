import React, { useRef } from 'react';

function GetStartedScreen() {
  const iframeRef = useRef(null);

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
    </div>
  );
}

export default GetStartedScreen;