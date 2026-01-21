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
  const [debugInfo, setDebugInfo] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [showTest, setShowTest] = useState(true);
  const navigate = useNavigate();
  
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);
  const lastBlobRef = useRef(null);

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

  const handleNext = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setMessages([]);
      setDebugInfo('');
      setRecordingTime(0);
      setAudioURL(null);
    } else {
      navigate('/thank-you');
    }
  };

  const downloadAudio = () => {
    if (lastBlobRef.current) {
      const url = URL.createObjectURL(lastBlobRef.current);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording.wav';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎤 === STARTING RECORDING ===');
      setDebugInfo('🎤 Requesting microphone...');
      setAudioURL(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false, // Disable to preserve full audio
          autoGainControl: false // Disable to preserve volume
        } 
      });
      
      streamRef.current = stream;
      console.log('✅ Microphone obtained');
      
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
        console.log('🛑 Recording stopped');
        
        if (chunks.length === 0) {
          setDebugInfo('❌ No audio captured');
          setIsProcessing(false);
          return;
        }
        
        const blob = new Blob(chunks, { type: 'audio/webm' });
        console.log('📦 Original blob:', blob.size, 'bytes');
        
        await processAudio(blob);
      };
      
      recorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      setDebugInfo('🔴 Recording...');
      
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed:', error);
      setDebugInfo('❌ Error: ' + error.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      setIsRecording(false);
      setDebugInfo('🔄 Processing...');
      setIsProcessing(true);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async (audioBlob) => {
    try {
      // Convert to WAV
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const wavBlob = audioBufferToWav(audioBuffer);
      lastBlobRef.current = wavBlob;
      
      // Create URL for playback
      const url = URL.createObjectURL(wavBlob);
      setAudioURL(url);
      
      console.log('📦 WAV created:', wavBlob.size, 'bytes');
      console.log('Duration:', audioBuffer.duration, 'seconds');
      
      audioContext.close();
      
      if (showTest) {
        setDebugInfo('✅ Recording complete! Listen to it below.');
        setIsProcessing(false);
      } else {
        await transcribeAudio(wavBlob);
      }
      
    } catch (error) {
      console.error('❌ Processing error:', error);
      setDebugInfo('❌ Error: ' + error.message);
      setIsProcessing(false);
    }
  };

  const audioBufferToWav = (audioBuffer) => {
    const numChannels = 1; // Force mono
    const sampleRate = audioBuffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    
    // Get channel data and convert to mono if needed
    let channelData;
    if (audioBuffer.numberOfChannels === 1) {
      channelData = audioBuffer.getChannelData(0);
    } else {
      // Mix down to mono
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

      console.log('🚀 Sending to Whisper...');
      
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
        const errorData = await response.json();
        throw new Error(`Whisper failed: ${response.status}`);
      }

      const data = await response.json();
      const transcript = data.text.trim();
      
      console.log('✅ Transcript:', transcript);
      setDebugInfo('');

      if (!transcript) {
        setDebugInfo('⚠️ No speech detected');
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
      console.error('❌ Error:', error);
      setDebugInfo('❌ Error: ' + error.message);
      setIsProcessing(false);
    }
  };

  const sendToChatGPT = async (userText) => {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
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
              content: `You are Echo, a friendly and approachable AI assistant having a natural conversation with visitors at the Futurium Museum about Agri-PV technology (the combination of agriculture and solar panels).

Conversation rules you must always follow:

1. The user may start by choosing one of these preset statements or by writing their own message:
   - "I really like the idea"
   - "I am skeptical"
   - "Could you explain Agri-PV?"

2. In your FIRST response:
   - Do NOT explain Agri-PV in detail unless the user explicitly asks for an explanation.
   - Ask a short follow-up question (maximum 2 sentences) to understand the user’s reason, opinion, or curiosity.
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
6. Stay focused only on Agri-PV and its benefits, challenges, or real-world use.
`
            },
            ...conversationHistory,
            {
              role: 'user',
              content: userText
            }
          ],
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
    <div className="chat-container">
      <div className="chat-header">
        <h1 className="chat-title">{currentQuestion}</h1>
      </div>

      {showTest && (
        <div style={{
          padding: '15px 20px',
          background: '#fff3e0',
          color: '#ef6c00',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          🧪 TEST MODE: Record, then listen to verify audio quality
          <button onClick={() => setShowTest(false)} style={{marginLeft: '20px', padding: '5px 15px'}}>
            Disable Test Mode
          </button>
        </div>
      )}

      {debugInfo && (
        <div style={{
          padding: '15px 20px',
          background: debugInfo.includes('❌') ? '#ffebee' : debugInfo.includes('⚠️') ? '#fff3e0' : debugInfo.includes('🔴') ? '#ffcdd2' : '#e8f5e9',
          color: debugInfo.includes('❌') ? '#c62828' : debugInfo.includes('⚠️') ? '#ef6c00' : debugInfo.includes('🔴') ? '#c62828' : '#2e7d32',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {debugInfo}
        </div>
      )}

      {isRecording && (
        <div style={{
          padding: '25px',
          background: 'linear-gradient(135deg, #ff1744 0%, #f50057 100%)',
          color: 'white',
          textAlign: 'center',
          fontSize: '40px',
          fontWeight: 'bold'
        }}>
          🔴 RECORDING: {recordingTime}s
        </div>
      )}

      {audioURL && showTest && (
        <div style={{
          padding: '20px',
          background: '#e3f2fd',
          textAlign: 'center'
        }}>
          <h3>🎧 Listen to your recording:</h3>
          <audio controls src={audioURL} style={{width: '80%', marginBottom: '10px'}} />
          <div>
            <button onClick={downloadAudio} style={{padding: '10px 20px', marginRight: '10px', fontSize: '16px'}}>
              Download WAV
            </button>
            <button onClick={() => transcribeAudio(lastBlobRef.current)} style={{padding: '10px 20px', fontSize: '16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px'}}>
              Send to Whisper
            </button>
          </div>
          <p style={{marginTop: '10px', fontSize: '14px'}}>
            Can you hear your voice clearly? If yes, click "Send to Whisper"
          </p>
        </div>
      )}

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
              {message.type === 'bot' && (
                <div className="waveform">
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                </div>
              )}
              <p className="message-text">{message.text}</p>
            </div>
          </div>
        ))}

        {isProcessing && !showTest && (
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

      <div className="recording-section">
        <button
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing && !showTest}
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

      <button className="next-button" onClick={handleNext}>
        Next →
      </button>
    </div>
  );
}

export default ChatScreen;