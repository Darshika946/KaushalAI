import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { AI_CHAT_URL } from '../../config/api';

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseMessageRef = useRef('');

  const isSpeechSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Clean up active recognition instance on unmount or navigation
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const toggleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    // If currently listening, stop recognition
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore stop errors
        }
      }
      setIsListening(false);
      return;
    }

    // Stop any previous instance before starting
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }

    setSpeechError(null);
    baseMessageRef.current = message;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }

        const base = baseMessageRef.current;
        const separator = base && !base.endsWith(' ') ? ' ' : '';
        const updated = base + separator + fullTranscript.trim();
        setMessage(updated);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // Non-fatal event, continue listening
        } else {
          setSpeechError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setSpeechError('Failed to start speech recognition. Please check your microphone.');
      setIsListening(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    // Stop listening if message is sent while speaking
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      setIsListening(false);
    }

    const currentMsg = message;
    const userMsg = { from: 'User', text: currentMsg };
    setMessage('');

    try {
      const res = await axios.post(`${AI_CHAT_URL}/chat`, { message: currentMsg });
      const aiMsg = { from: 'AI', text: res.data.response };
      setConversation((prev) => [...prev, userMsg, aiMsg]);
    } catch (err) {
      console.error(err);
      setConversation((prev) => [
        ...prev,
        userMsg,
        {
          from: 'AI',
          text: `Focus your preparation on core domain fundamentals, system architecture, and regular problem solving.

Key technical areas:
- Data structures and algorithmic time and space complexity.
- Production error handling, caching, and database query optimization.
- Clear articulation of trade-offs and design constraints.

Specify the exact concept or implementation you want to review.`
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#1A2A44] to-[#2C3E50] px-4 py-10">
      <div className="w-full max-w-4xl h-[560px] bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-700 text-white px-6 py-4 text-xl font-semibold text-center">
          AI Career Assistant
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 scroll-smooth">
          {conversation.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Ask a question about interview preparation, domain skills, or career guidance.
            </div>
          )}

          {conversation.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.from === 'User' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-4 py-3 rounded-lg shadow-md max-w-xl text-sm ${
                  msg.from === 'User'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none'
                }`}
              >
                <span className={`block font-medium mb-1 text-xs ${msg.from === 'User' ? 'text-blue-100' : 'text-blue-700 font-semibold'}`}>
                  {msg.from}
                </span>
                <div className="break-words whitespace-pre-line leading-relaxed">
                  {typeof msg.text === 'string' ? msg.text.replace(/^#{1,6}\s*/gm, '') : msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4 bg-white space-y-2">
          {/* Unsupported notice or speech error */}
          {!isSpeechSupported && (
            <p className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
              Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge for voice input.
            </p>
          )}

          {speechError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {speechError}
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMessage();
              }}
              placeholder="Type your message or click Voice Input to speak..."
              className="flex-1 p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`px-4 py-3 rounded-md text-sm font-semibold transition shrink-0 ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-800 text-white'
              }`}
            >
              {isListening ? 'Listening...' : 'Voice Input'}
            </button>
            <button
              type="button"
              onClick={sendMessage}
              className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold text-sm shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
