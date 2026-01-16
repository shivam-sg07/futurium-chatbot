import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatScreen.css';

const questions = [
  {
    question: "WHAT DO YOU THINK ABOUT AGRI-PV?",
    options: [
      "I really like the idea!",
      "I am skeptical!",
      "Could you explain Agri-PV?"
    ]
  },
  {
    question: "WOULD YOU LIKE TO SEE AGRI-PV IN YOUR REGION?",
    options: [
      "Yes, definitely!",
      "Not sure yet!",
      "Could you provide facts about Agri-PV?"
    ]
  },
  {
    question: "DO YOU THINK AGRI-PV IS GOOD FOR FARMERS?",
    options: [
      "Yes, definitely!",
      "Not sure yet!",
      "Could you explain Agri-PV?"
    ]
  },
  {
    question: "WOULD YOU SUPPORT AGRI-PV ON FARMLAND YOU KNOW?",
    options: [
      "Yes, definitely!",
      "I am skeptical!",
      "Could you explain Agri-PV?"
    ]
  },
  {
    question: "WHAT BENEFITS DO YOU SEE IN COMBINING AGRICULTURE WITH SOLAR?",
    options: [
      "Many!",
      "Not a lot!",
      "Could you explain Agri-PV?"
    ]
  },
  {
    question: "HOW DO YOU FEEL ABOUT MIXING FARMING AND SOLAR PANELS?",
    options: [
      "I really like the idea!",
      "I am skeptical!",
      "Could you explain Agri-PV?"
    ]
  },
  {
    question: "WHAT WORRIES YOU ABOUT AGRI-PV?",
    options: [
      "Nothing!",
      "Quite a lot!",
      "Could you explain Agri-PV?"
    ]
  },
  {
    question: "WHAT SURPRISED YOU IN THIS EXHIBIT AND SIMULATIONS?",
    options: [
      "Nothing!",
      "Quite a lot!",
      "Could you explain Agri-PV?"
    ]
  },
  {
    question: "WHAT PART OF THIS DISPLAY INTERESTS YOU THE MOST?",
    options: [
      "Nothing!",
      "Quite a lot!",
      "Could you explain Agri-PV?"
    ]
  }
];

function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [conversationStarted, setConversationStarted] = useState(false);
  const navigate = useNavigate();
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' , block: 'nearest'});
  }, [messages]);

  const handleOptionSelect = (option) => {
    const userMessage = {
      type: 'user',
      text: option,
      timestamp: new Date()
    };
    setMessages([userMessage]);
    setConversationStarted(true);

    sendToChatGPT(option, true);
  };
  
  const handleNext = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setMessages([]); // Clear messages for new question
      setConversationStarted(false);
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

      sendToChatGPT(simulatedText, false);
    }, 1500);
  };

  const sendToChatGPT = async (userText, isFirstMessage) => {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
      
      const conversationHistory = [
        {
          role: 'system',
          content: `You are a helpful assistant collecting feedback about Agri-PV technology. 
                   The current question being discussed is: "${currentQuestion.question}".
                   Keep responses concise and friendly.`
        }
      ];

      messages.forEach(msg => {
        conversationHistory.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        });
      });

      conversationHistory.push({
        role: 'user',
        content: userText
      });
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: conversationHistory,
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
    <div className={`chat-container ${!conversationStarted ? 'initial-state' : ''}`}>
      {/* Header */}
      <div className="chat-header">
        <h1 className="chat-title">{currentQuestion.question}</h1>
      </div>

      {/* default options if conversation hasn't started yet*/}
      {!conversationStarted && (
        <div className="options-container">
          <div className="options-buttons">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className="option-button"
                onClick={() => handleOptionSelect(option)}
                disabled={isProcessing}
              >{option}
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Messages Area */}
      {conversationStarted && (
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-wrapper ${message.type === 'user' ? 'user-message-wrapper' : 'bot-message-wrapper'}`}
          >
            {/* Avatar */}
              {message.type === 'bot' && (
                <div className="avatar bot-avatar">
                <div className="avatar-icon bot-avatar">
                <div className="avatar-icon bot-icon">
                  <div className="bot-head">
                    <div className="bot-antenna"></div>
                    <div className="bot-face">🤖</div>
                  </div>
                </div>
                </div>
              </div>
              )}

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
      </div>)}

      {/* Recording Button */}
      {conversationStarted && (
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
      )}
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