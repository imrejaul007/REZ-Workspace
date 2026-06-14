'use client';

import { useState } from 'react'

// Generate unique ID using crypto
function generateUniqueId(): string {
  return crypto.randomUUID();
}

// Secure random index for array selection
function secureRandomIndex(length: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % length;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const quickActions = [
  'Find React Developer jobs in Bangalore',
  'What skills are most in demand?',
  'Compare salaries for Full Stack roles',
  'Help me optimize my resume',
  'Find candidates with ML experience',
];

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'Hi! I\'m your AI recruiting assistant. I can help you with:\n\n• Finding the perfect candidates\n• Matching job requirements to talent\n• Salary benchmarking\n• Resume optimization\n\nHow can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (message?: string) => {
    const text = message || input;
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const responses = [
      "Based on your requirements, I've found 45 matching candidates. The top 5 have 90%+ match scores with React and Node.js experience.",
      "The most in-demand skills right now are React (95%), Python (92%), and AWS (85%). Salaries for these skills are 15-20% above average.",
      "For Full Stack roles in Bangalore, the average salary range is ₹12-25 LPA depending on experience. Senior developers can expect ₹20+ LPA.",
      "I've analyzed your resume and have a few suggestions: Add more quantifiable achievements, highlight your React projects, and include AWS experience.",
      "I found 28 candidates with ML experience in Hyderabad. 12 of them have 85%+ match scores for your Data Scientist position.",
    ];

    const aiResponse: Message = {
      role: 'ai',
      content: responses[secureRandomIndex(responses.length)],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <div style={{ padding: 16, background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>🤖 AI Recruiter Agent</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, opacity: 0.9 }}>Powered by REZ Intelligence</p>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'ai' && (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                🤖
              </div>
            )}
            <div style={{
              maxWidth: '70%',
              padding: 16,
              borderRadius: 16,
              background: msg.role === 'user' ? '#8b5cf6' : 'white',
              color: msg.role === 'user' ? 'white' : '#374151',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              whiteSpace: 'pre-line',
            }}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                👤
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🤖
            </div>
            <div style={{ padding: 16, background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <span style={{ animation: 'pulse 1s infinite' }}>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', background: 'white' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSend(action)}
              style={{
                padding: '8px 12px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: 16,
                cursor: 'pointer',
                fontSize: 13,
                color: '#374151',
              }}
            >
              {action}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Ask me anything about recruiting..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            style={{
              flex: 1,
              padding: 12,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            style={{
              padding: '12px 24px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              opacity: input.trim() ? 1 : 0.5,
            }}
          >
            Send
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
