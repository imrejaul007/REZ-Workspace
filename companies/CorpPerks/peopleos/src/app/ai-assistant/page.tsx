'use client';

import { useState } from 'react';

const quickQuestions = [
  'Who has the highest attendance this month?',
  'Which employees are at attrition risk?',
  'Suggest best interns for full-time hire',
  'Team productivity report',
];

export default function AIAssistantPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const askQuestion = async (q: string) => {
    setQuestion(q);
    setLoading(true);
    // Connect to REZ Intelligence
    await new Promise(r => setTimeout(r, 1500));
    setAnswer(`Based on analysis:

• Top performers: Rahul Verma (98%), Priya Sharma (95%)
• Attendance trend: +12% improvement vs last month
• Recommended action: Consider Rahul for promotion in Q3

Connect to REZ Intelligence API for live insights.`);
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>🧠 AI Assistant</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Ask anything about your workforce in natural language
      </p>

      {/* Quick Questions */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>Try these:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => askQuestion(q)}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '20px',
                fontSize: '13px',
                cursor: 'pointer',
                color: '#374151',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Question Input */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about workforce, hiring, or performance..."
            style={{
              flex: 1,
              padding: '14px 20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '15px',
            }}
            onKeyDown={(e) => e.key === 'Enter' && question && askQuestion(question)}
          />
          <button
            onClick={() => question && askQuestion(question)}
            disabled={loading}
            style={{
              padding: '14px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Analyzing...' : 'Ask AI'}
          </button>
        </div>
      </div>

      {/* Answer */}
      {answer && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          borderLeft: '4px solid #10b981',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <span style={{ fontWeight: '600', color: '#10b981' }}>AI Insights</span>
          </div>
          <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: '#374151' }}>
            {answer}
          </div>
        </div>
      )}

      {/* Sample Insights */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>📊 Available Insights</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { icon: '📈', title: 'Attrition Risk', desc: 'Predict which employees may leave' },
            { icon: '🔥', title: 'Burnout Detection', desc: 'Identify overworked staff' },
            { icon: '⭐', title: 'Performance Score', desc: 'AI-powered performance metrics' },
            { icon: '💰', title: 'Salary Insights', desc: 'Market-rate benchmarking' },
            { icon: '📋', title: 'Hiring Funnel', desc: 'Conversion optimization' },
            { icon: '🎯', title: 'Best Candidates', desc: 'AI-ranked candidate matching' },
          ].map((item) => (
            <div key={item.title} style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '32px' }}>{item.icon}</span>
              <h4 style={{ margin: '12px 0 4px', fontSize: '14px' }}>{item.title}</h4>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
