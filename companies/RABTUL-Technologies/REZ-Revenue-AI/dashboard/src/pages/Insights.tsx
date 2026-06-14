import { useState } from 'react';
import { MessageSquare, Send, Lightbulb, AlertTriangle, TrendingUp, Users } from 'lucide-react';

const quickQuestions = [
  'Why are sales down this week?',
  'How can I increase revenue?',
  'Best pricing strategy for weekends?',
  'How to reduce customer churn?',
  'What offers work best for new customers?',
];

const diagnosisResult = {
  summary: 'Revenue declined 12% this week',
  diagnosis: 'Multiple factors contributing to decline',
  factors: [
    { name: 'Weather', impact: -8, description: 'Heavy rainfall Mon-Wed reduced footfall' },
    { name: 'Competition', impact: -5, description: 'New salon opened nearby with 20% lower prices' },
    { name: 'Timing Shift', impact: -3, description: 'Friday evening bookings moved to Saturday' },
  ],
  recommendations: [
    { action: 'Lower Friday 5PM pricing by 10%', impact: '+12%', confidence: '85%', priority: 'quick_win' },
    { action: 'Launch monsoon special discount 15%', impact: '+8%', confidence: '78%', priority: 'medium' },
    { action: 'Facebook campaign targeting local area', impact: '+5%', confidence: '65%', priority: 'medium' },
  ],
  quickWins: [
    'Activate 3PM off-peak promotion',
    'Bundle hair wash with haircut @ ₹150 extra',
  ],
};

export default function Insights() {
  const [question, setQuestion] = useState('');
  const [showDiagnosis, setShowDiagnosis] = useState(false);

  const handleAskQuestion = () => {
    if (question.toLowerCase().includes('sales down') || question.toLowerCase().includes('why')) {
      setShowDiagnosis(true);
    }
  };

  return (
    <div>
      <div className="header">
        <div>
          <h2>AI Merchant Advisor</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Ask questions in natural language and get AI-powered insights
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Question Input */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <MessageSquare size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Ask the AI Advisor
            </span>
          </div>

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your business... e.g., 'Why are sales down this week?'"
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '1rem',
                background: 'var(--bg-dark)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                resize: 'vertical',
              }}
            />
            <button
              onClick={handleAskQuestion}
              className="btn btn-primary"
              style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}
            >
              <Send size={18} />
              Ask
            </button>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Quick Questions:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {quickQuestions.map((q, index) => (
                <button
                  key={index}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                  onClick={() => {
                    setQuestion(q);
                    if (q.toLowerCase().includes('sales down')) {
                      setShowDiagnosis(true);
                    }
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnosis Result */}
        {showDiagnosis && (
          <div className="card" style={{ borderColor: 'var(--primary)' }}>
            <div className="card-header">
              <span className="card-title">
                <AlertTriangle size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle', color: 'var(--warning)' }} />
                Diagnosis Result
              </span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem' }}>
                {diagnosisResult.summary}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {diagnosisResult.diagnosis}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>CONTRIBUTING FACTORS</div>
              {diagnosisResult.factors.map((factor, index) => (
                <div key={index} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ color: 'var(--danger)', fontWeight: 600, minWidth: '50px' }}>
                    {factor.impact > 0 ? '+' : ''}{factor.impact}%
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{factor.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{factor.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>RECOMMENDATIONS</div>
              {diagnosisResult.recommendations.map((rec, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{rec.action}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confidence: {rec.confidence}</div>
                  </div>
                  <span className="badge badge-success">+{rec.impact}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>QUICK WINS</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {diagnosisResult.quickWins.map((win, index) => (
                  <span key={index} className="badge badge-warning">{win}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights Cards */}
      {!showDiagnosis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div className="card">
            <div className="insight-item">
              <div className="insight-icon">
                <TrendingUp size={20} />
              </div>
              <div className="insight-content">
                <h4>Revenue Optimization</h4>
                <p>Your peak hour pricing could be increased by 15% without affecting conversion.</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="insight-item">
              <div className="insight-icon">
                <Users size={20} />
              </div>
              <div className="insight-content">
                <h4>Customer Retention</h4>
                <p>22 customers at risk of churning. Targeted offers could save 8.</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="insight-item">
              <div className="insight-icon">
                <Lightbulb size={20} />
              </div>
              <div className="insight-content">
                <h4>Opportunity</h4>
                <p>Bundle deals could increase AOV by ₹180 on average.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
