'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: Action[];
  type?: 'text' | 'action' | 'data';
}

interface Action {
  type: 'button' | 'link' | 'confirm';
  label: string;
  onClick?: () => void;
  href?: string;
  confirm?: string;
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your PeopleOS Agent. I can help you with:\n\n• Managing employees\n• Scheduling shifts\n• Reviewing leaves\n• Generating reports\n• Predicting attrition\n\nJust tell me what you need in plain language.',
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processMessage = async (userMessage: string) => {
    const msg = userMessage.toLowerCase();

    setLoading(true);

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 1500));

    let response: Message;

    if (msg.includes('add') && (msg.includes('employee') || msg.includes('hire'))) {
      response = {
        role: 'assistant',
        content: 'I can help you add a new employee. Let me set that up:',
        type: 'action',
        actions: [
          { type: 'button', label: '📝 Add New Employee', onClick: () => alert('Opening employee form...') },
          { type: 'button', label: '📋 Import from CSV', onClick: () => alert('Opening import...') },
        ],
      };
    } else if (msg.includes('attendance') || msg.includes('present')) {
      response = {
        role: 'assistant',
        content: '📊 Today\'s Attendance Report:\n\n• Present: 42 employees (93%)\n• Absent: 3 employees\n• Late: 2 employees\n\nWould you like me to send reminders to absent employees?',
        type: 'data',
        actions: [
          { type: 'button', label: '📱 Send Reminders', onClick: () => alert('Sending reminders...') },
          { type: 'button', label: '📈 View Detailed Report', onClick: () => alert('Opening report...') },
        ],
      };
    } else if (msg.includes('leave') || msg.includes('approve')) {
      response = {
        role: 'assistant',
        content: '🔍 Leave Requests:\n\n• Priya Sharma: Sick Leave (3 days) - PENDING\n• Rahul Verma: Casual Leave (2 days) - APPROVED\n\nShall I process Priya\'s request?',
        type: 'action',
        actions: [
          { type: 'button', label: '✅ Approve Priya\'s Leave', onClick: () => alert('Leave approved!') },
          { type: 'button', label: '❌ Reject', onClick: () => alert('Opening reject form...') },
          { type: 'button', label: '📋 View All Requests', onClick: () => alert('Opening leave management...') },
        ],
      };
    } else if (msg.includes('shift') || msg.includes('schedule')) {
      response = {
        role: 'assistant',
        content: '📅 Shift Management:\n\n• Morning (6 AM - 2 PM): 15 employees\n• Afternoon (2 PM - 10 PM): 18 employees\n• Night (10 PM - 6 AM): 9 employees\n\nShall I create or modify any shifts?',
        type: 'action',
        actions: [
          { type: 'button', label: '➕ Create New Shift', onClick: () => alert('Opening shift form...') },
          { type: 'button', label: '🔄 Auto-Schedule', onClick: () => alert('Generating optimal schedule...') },
        ],
      };
    } else if (msg.includes('attrition') || msg.includes('risk') || msg.includes('leave risk')) {
      response = {
        role: 'assistant',
        content: '🔴 Attrition Risk Analysis:\n\n**High Risk (3 employees):**\n• Rahul V. - 89% risk (low engagement)\n• Sneha P. - 76% risk (missed targets)\n• Amit K. - 71% risk (no promotion)\n\n**Recommendations:**\n1. Schedule 1:1 meetings\n2. Review compensation\n3. Offer growth opportunities\n\nShall I create retention actions?',
        type: 'data',
        actions: [
          { type: 'button', label: '📧 Send Engagement Survey', onClick: () => alert('Survey sent!') },
          { type: 'button', label: '📊 View Full Report', onClick: () => alert('Opening report...') },
          { type: 'button', label: '✅ Create Retention Plan', onClick: () => alert('Creating plan...') },
        ],
      };
    } else if (msg.includes('report') || msg.includes('analytics')) {
      response = {
        role: 'assistant',
        content: '📊 Generating Report...\n\n**Workforce Summary:**\n• Total Employees: 45\n• Monthly Cost: ₹12,50,000\n• Avg. Tenure: 14 months\n• Productivity Score: 78%\n\nWhich report would you like me to generate?',
        type: 'action',
        actions: [
          { type: 'button', label: '💰 Payroll Report', onClick: () => alert('Generating payroll report...') },
          { type: 'button', label: '📈 Attendance Report', onClick: () => alert('Generating attendance report...') },
          { type: 'button', label: '👥 Headcount Report', onClick: () => alert('Generating headcount report...') },
        ],
      };
    } else if (msg.includes('hire') || msg.includes('recruit') || msg.includes('job')) {
      response = {
        role: 'assistant',
        content: '💼 Hiring Assistant:\n\n• Active Jobs: 12\n• Total Applications: 156\n• Interviews Scheduled: 5\n• Offers Extended: 2\n\nShall I help you post a new job or review candidates?',
        type: 'action',
        actions: [
          { type: 'button', label: '📝 Post New Job', onClick: () => alert('Opening job form...') },
          { type: 'button', label: '👤 Review Candidates', onClick: () => alert('Opening candidates...') },
          { type: 'button', label: '🤖 AI Shortlist', onClick: () => alert('AI shortlisting...') },
        ],
      };
    } else {
      response = {
        role: 'assistant',
        content: 'I understand you need help with workforce management. Here are things I can do:\n\n• "Show today\'s attendance"\n• "Approve leave requests"\n• "Schedule shifts for next week"\n• "Who is at attrition risk?"\n• "Generate payroll report"\n• "Post a new job opening"\n\nJust describe what you need!',
        type: 'text',
      };
    }

    setMessages(prev => [...prev, response]);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input, type: 'text' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    processMessage(input);
  };

  const quickActions = [
    'Show attendance today',
    'Review pending leaves',
    'Who is at attrition risk?',
    'Schedule next week shifts',
    'Generate payroll report',
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', gap: 0 }}>
      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}>
            🧠
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>PeopleOS Agent</h1>
            <p style={{ fontSize: '13px', color: '#10b981', margin: 0 }}>● Online • Ready to help</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '16px',
            }}>
              <div style={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                gap: '12px',
                alignItems: 'flex-start',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                  }}>
                    🧠
                  </div>
                )}
                <div>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: msg.role === 'user' ? '#10b981' : 'white',
                    color: msg.role === 'user' ? 'white' : '#1f2937',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.6,
                  }}>
                    {msg.content}
                  </div>

                  {/* Action Buttons */}
                  {msg.actions && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {msg.actions.map((action, j) => (
                        <button
                          key={j}
                          onClick={action.onClick}
                          style={{
                            padding: '8px 16px',
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '20px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            color: '#374151',
                            fontWeight: 500,
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}>
                    👤
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}>
                🧠
              </div>
              <div style={{
                padding: '12px 16px',
                background: 'white',
                borderRadius: '16px',
                display: 'flex',
                gap: '4px',
              }}>
                <span style={{ animation: 'bounce 1s infinite' }}>●</span>
                <span style={{ animation: 'bounce 1s infinite 0.2s' }}>●</span>
                <span style={{ animation: 'bounce 1s infinite 0.4s' }}>●</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div style={{
          padding: '12px 24px',
          background: 'white',
          borderTop: '1px solid #e5e7eb',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(action);
                  processMessage(action);
                  setInput('');
                }}
                style={{
                  padding: '6px 12px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you need... (e.g., 'Show attendance for today')"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '12px 24px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
