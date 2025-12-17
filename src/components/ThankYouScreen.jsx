import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ThankYouScreen.css';

function ThankYouScreen() {
  const navigate = useNavigate();

  const handleRestart = () => {
    navigate('/');
  };

  return (
    <div className="thankyou-container">
      <div className="thankyou-content">
        <div className="thankyou-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#E7F669" strokeWidth="2"/>
            <path d="M8 12l2.5 2.5L16 9" stroke="#E7F669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h1 className="thankyou-title">THANK YOU!</h1>
        
        <p className="thankyou-message">
          Your feedback on AGRI-PV is greatly appreciated. 
          Together, we can shape a more sustainable future.
        </p>

        <div className="thankyou-divider"></div>

        <p className="thankyou-submessage">
          Your responses will help us understand public perception 
          and improve renewable energy solutions.
        </p>

        <button 
          className="restart-button"
          onClick={handleRestart}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default ThankYouScreen;
