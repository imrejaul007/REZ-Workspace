/**
 * MerchantGPT Agent Chat Component
 * AI-powered chat interface for revenue assistance
 * @module pages/ChatBot
 * @author RTNM Digital
 * @version 1.0.0
 *
 * Environment Variables (prefix with VITE_ for Vite):
 * - VITE_REVENUE_AGENT_URL: Revenue Agent endpoint (default: http://localhost:4330)
 */

import { useState } from 'react';
import { Send, Bot, Sparkles, Loader2 } from 'lucide-react';

// Revenue Agent URL - configurable via environment
const REVENUE_AGENT_URL = import.meta.env.VITE_REVENUE_AGENT_URL || 'http://localhost:4330';

/**
 * @typedef {Object} Message
 * @property {string} id - Unique message identifier
 * @property {'user' | 'assistant'} role - Message sender role
 * @property {string} content - Message content
 * @property {Array<{id: string, title: string}>} [actions] - Suggested actions
 */

/**
 * @typedef {Object} AgentChatProps
 * @property {string} [merchantId] - Merchant identifier (default: 'demo_merchant')
 */

interface AgentChatProps {
  merchantId?: string;
}

/**
 * Agent Chat Component
 * Provides conversational interface to Revenue AI Agent
 * @param {AgentChatProps} props - Component props
 * @returns {JSX.Element} Chat interface component
 *
 * @example
 * <AgentChat merchantId="merchant_123" />
 */
export default function AgentChat({ merchantId = 'demo_merchant' }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Revenue AI Agent. I can help you with:\n\n• Dynamic pricing recommendations\n• Customer insights\n• Campaign strategies\n• Revenue forecasting\n\nWhat would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handle sending a message
   * @returns {Promise<void>}
   */
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${REVENUE_AGENT_URL}/api/v1/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          message: input,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.response,
          actions: data.data.actions,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback message on connection failure
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I had trouble connecting. Please try again.',
        },
      ]);
    }

    setLoading(false);
  };

  /**
   * Quick action buttons for common queries
   * @type {Array<{label: string, message: string}>}
   */
  const quickActions = [
    { label: 'Why are sales down?', message: 'Why are my sales down this week?' },
    { label: 'Increase revenue', message: 'How can I make ₹50K more this month?' },
    { label: 'Run campaign', message: 'What campaigns should I run?' },
    { label: 'Staffing help', message: 'How many staff should I schedule tomorrow?' },
  ];

  return (
    <div className="agent-chat">
      {/* Quick Actions */}
      <div className="quick-actions">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="btn btn-outline btn-sm"
              onClick={() => setInput(action.message)}
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role}`}
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1rem',
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div
              className="message-avatar"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: message.role === 'assistant' ? 'var(--primary)' : 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {message.role === 'assistant' ? <Bot size={18} /> : <Sparkles size={18} />}
            </div>
            <div
              className="message-content"
              style={{
                maxWidth: '70%',
                padding: '0.75rem 1rem',
                borderRadius: '1rem',
                background: message.role === 'assistant' ? 'var(--bg-card)' : 'var(--primary)',
                whiteSpace: 'pre-wrap',
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}
            >
              {message.content}
              {message.actions && message.actions.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {message.actions.map((action) => (
                    <button
                      key={action.id}
                      className="btn btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => setInput(`Execute: ${action.title}`)}
                    >
                      {action.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant" style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="message-avatar" style={{ background: 'var(--primary)' }}>
              <Bot size={18} />
            </div>
            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: '1rem' }}>
              <Loader2 size={18} className="animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="chat-input" style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything about your revenue..."
          className="input"
          style={{ flex: 1 }}
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={loading || !input.trim()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}