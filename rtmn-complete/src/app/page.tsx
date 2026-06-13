'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, BarChart3, Brain, Zap, CheckCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const SAMPLE_QUESTIONS = [
  { label: 'What are my sales this week?', industry: 'retail' },
  { label: 'Show my inventory status', industry: 'retail' },
  { label: 'What orders need attention?', industry: 'restaurant' },
  { label: 'Kitchen inventory report', industry: 'restaurant' },
  { label: 'Invoice status report', industry: 'finance' },
  { label: 'Appointment schedule', industry: 'healthcare' },
];

const INDUSTRIES = [
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'legal', label: 'Legal' },
];

export default function BOADashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [industry, setIndustry] = useState('retail');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Check connection
    fetch(`${API_BASE}/health`)
      .then(r => r.ok && setConnected(true))
      .catch(() => setConnected(false));
  }, []);

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `🤖 **RTMN Business Operating Agent**

Welcome! I'm your executive intelligence assistant. I analyze data from your entire business ecosystem.

**Try these questions:**
- "What are my sales this week?"
- "Show inventory status"
- "What needs attention?"

Select an industry and ask your question!`,
      timestamp: new Date()
    }]);
  }, []);

  const sendQuery = async (query: string) => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, industry, sessionId })
      });

      if (!response.ok) throw new Error('Request failed');

      const data = await response.json();

      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        data
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Connection error. Please ensure RTMN Complete is running on port 3000.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BOA</h1>
                <p className="text-xs text-slate-400">Business Operating Agent</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-slate-400">{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                {INDUSTRIES.map(ind => (
                  <option key={ind.value} value={ind.value}>{ind.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 h-[calc(100vh-200px)] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
                        : 'bg-slate-700/50 text-slate-100 border border-slate-600/30'
                    }`}>
                      <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700/50 rounded-2xl px-4 py-3 border border-slate-600/30">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        <span className="text-slate-300">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-slate-700/50">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your business..."
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl px-6 py-3 font-medium transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                {SAMPLE_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setIndustry(q.industry); sendQuery(q.label); }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-sm text-slate-300 transition-colors"
                    disabled={isLoading}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Platform Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Twins</span>
                  <span className="text-sm text-white font-medium">22</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Industries</span>
                  <span className="text-sm text-white font-medium">6</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Skills</span>
                  <span className="text-sm text-white font-medium">14</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Agents</span>
                  <span className="text-sm text-white font-medium">5</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-400">TwinOS Hub</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-400">Business Copilot</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-400">BOA Engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
