import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatScreen.css';

const questions = [
  "WHAT DO YOU THINK ABOUT AGRI-PV?",
  "WOULD YOU LIKE TO SEE AGRI-PV IN YOUR REGION?",
  "DO YOU THINK AGRI-PV IS GOOD FOR FARMERS?",
  "WOULD YOU SUPPORT AGRI-PV ON FARMLAND YOU KNOW?",
  "WHAT BENEFITS DO YOU SEE IN COMBINING AGRICULTURE WITH SOLAR?",
  "HOW DO YOU FEEL ABOUT MIXING FARMING AND SOLAR PANELS?",
  "WHAT BENIFITS DO YOU EXPECT FROM AGRI-PV?",
  "WHAT WORRIES YOU ABOUT AGRI-PV",
  "WHAT SURPRISED YOU IN THIS EXHIBIT AND SIMULATIONS?",
  "WHAT PART OF THIS DISPLAY INTERESTS YOU THE MOST?"
];

function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const navigate = useNavigate();
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' , block: 'nearest'});
  }, [messages]);

  const handleNext = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setMessages([]); // Clear messages for new question
    } else {
      navigate('/thank-you'); // Navigate to thank you page after last question
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob) => {
    setTimeout(() => {
      const simulatedText = "I think Agri-PV is a great innovation for sustainable farming!";
      
      const userMessage = {
        type: 'user',
        text: simulatedText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      sendToChatGPT(simulatedText);
    }, 1500);
  };

  const sendToChatGPT = async (userText) => {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant collecting feedback about Agri-PV technology. Keep responses concise and friendly.'
            },
            {
              role: 'user',
              content: userText
            }
          ],
          max_tokens: 150
        })
      });

      const data = await response.json();
      const botResponse = data.choices[0].message.content;

      const botMessage = {
        type: 'bot',
        text: botResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error calling ChatGPT:', error);
      
      const botMessage = {
        type: 'bot',
        text: "Thank you for your feedback! That's very insightful.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsProcessing(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <h1 className="chat-title">{currentQuestion}</h1>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-wrapper ${message.type === 'user' ? 'user-message-wrapper' : 'bot-message-wrapper'}`}
          >
            {/* Avatar */}
            <div className={`avatar ${message.type === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
              {message.type === 'user' ? (
                <div className="avatar-icon user-icon">
                  <div className="user-head"></div>
                  <div className="user-body"></div>
                </div>
              ) : (
                <div className="avatar-icon bot-icon">
                  <div className="bot-head">
                    <div className="bot-antenna"></div>
                    <div className="bot-face">🤖</div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Bubble */}
            <div className={`message-bubble ${message.type === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
              {/* Only show waveform for user messages */}
              {message.type === 'bot' && (
                <div className="waveform">
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                </div>
              )}

              {/* Message Text */}
              <p className="message-text">{message.text}</p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="processing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Recording Button */}
      <div className="recording-section">
        <button
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          {isRecording ? (
            <>
              {/* Recording animation - waveform */}
              <div className="button-waveform">
                <div className="button-wave-bar"></div>
                <div className="button-wave-bar"></div>
                <div className="button-wave-bar"></div>
                <div className="button-wave-bar"></div>
                <div className="button-wave-bar"></div>
              </div>
            </>
          ) : (
            <>
              {/* Microphone icon when not recording */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Next Button */}
      <button 
        className="next-button"
        onClick={handleNext}
      >
        Next →
      </button>
    </div>
  );
}

export default ChatScreen;