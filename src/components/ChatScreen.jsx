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
    question: "DO YOU THINK AGRI-PV IS GOOD FOR FARMERS?",
    options: [
      "Yes, definitely!",
      "Not sure yet!",
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
  
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);


  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleOptionSelect = (option) => {
    const userMessage = {
      type: 'user',
      text: option,
      timestamp: new Date()
    };
    setMessages([userMessage]);
    setConversationStarted(true);
    setIsProcessing(true);

    sendToChatGPT(option);
  };
  
  const handleNext = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setMessages([]);
      setConversationStarted(false);
    } else {
      navigate('/thank-you');
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });
      
      recorderRef.current = recorder;
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        if (chunks.length === 0) {
          console.error('No audio captured');
          setIsProcessing(false);
          return;
        }
        
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await processAudio(blob);
      };
      
      recorder.start(100);
      setIsRecording(true);
      
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async (audioBlob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const wavBlob = audioBufferToWav(audioBuffer);
      audioContext.close();
      
      await transcribeAudio(wavBlob);
      
    } catch (error) {
      console.error('Processing error:', error);
      setIsProcessing(false);
    }
  };

  const audioBufferToWav = (audioBuffer) => {
    const numChannels = 1;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    
    let channelData;
    if (audioBuffer.numberOfChannels === 1) {
      channelData = audioBuffer.getChannelData(0);
    } else {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      channelData = new Float32Array(audioBuffer.length);
      for (let i = 0; i < audioBuffer.length; i++) {
        channelData[i] = (left[i] + right[i]) / 2;
      }
    }
    
    const length = channelData.length * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitDepth / 8, true);
    view.setUint16(32, numChannels * bitDepth / 8, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const transcribeAudio = async (wavBlob) => {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      if (!apiKey || !apiKey.startsWith('sk-')) {
        throw new Error('Invalid API key');
      }

      const audioFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
      
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('prompt', 'This is feedback about Agri-PV solar panel technology.');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Whisper failed: ${response.status}`);
      }

      const data = await response.json();
      const transcript = data.text.trim();
      
      console.log('Transcript:', transcript);

      if (!transcript) {
        console.warn('No speech detected');
        setIsProcessing(false);
        return;
      }

      const userMessage = {
        type: 'user',
        text: transcript,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      await sendToChatGPT(transcript);

    } catch (error) {
      console.error('Transcription error:', error);
      setIsProcessing(false);
    }
  };

  const sendToChatGPT = async (userText) => {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      const conversationHistory = [
        {
          role: 'system',
          content: `You are Echo, a friendly and approachable AI assistant having a natural conversation with visitors at the Futurium Museum about Agri-PV technology (the combination of agriculture and solar panels).

The current question being discussed is: "${currentQuestion.question}"

Conversation rules you must always follow:

1. The user may start by choosing one of these preset statements or by writing their own message:
   - "I really like the idea"
   - "I am skeptical"
   - "Could you explain Agri-PV?"

2. In your FIRST response:
   - Do NOT explain Agri-PV in detail unless the user explicitly asks for an explanation.
   - Ask a short follow-up question (maximum 2 sentences) to understand the user's reason, opinion, or curiosity.
   - Example: ask why they like it, why they are skeptical, or what part they want explained.

3. In the NEXT turn:
   - If the user gives only a statement (no question):
     - Respond with 1 sentence positively acknowledging or reflecting their point.
     - Then ask 1 sentence inviting them to add a thought or ask a question.
   - If the user includes a question:
     - Answer the question briefly in 1–2 sentences, keeping the tone friendly and museum-appropriate.
     - Then ask 1 sentence inviting more questions or comments.

4. Keep responses concise, conversational, and easy to understand.
5. Never use more than 3 sentences total in any response.
6. Stay focused only on Agri-PV and its benefits, challenges, or real-world use.`
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
          max_tokens: 100,
          temperature: 0.7
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
      console.error('ChatGPT error:', error);
      const botMessage = {
        type: 'bot',
        text: "Thank you for sharing your thoughts!",
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

      {/* Default options if conversation hasn't started yet */}
      {!conversationStarted && (
        <div className="options-container">
          <div className="options-buttons">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className="option-button"
                onClick={() => handleOptionSelect(option)}
                disabled={isProcessing}
              >
                {option}
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

              <div className={`message-bubble ${message.type === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                
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
      )}

      {/* Recording Button */}
      {conversationStarted && (
        <div className="recording-section">
          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isRecording ? (
              <div className="button-waveform">
                <div className="button-wave-bar"></div>
                <div className="button-wave-bar"></div>
                <div className="button-wave-bar"></div>
                <div className="button-wave-bar"></div>
                <div className="button-wave-bar"></div>
              </div>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
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