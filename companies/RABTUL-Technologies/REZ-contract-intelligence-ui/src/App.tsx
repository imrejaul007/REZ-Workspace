import { useState } from 'react';

interface Clause {
  id: string;
  title: string;
  content: string;
  type: 'standard' | 'risky' | 'warning' | 'negotiable';
  page: number;
}

interface AnalysisResult {
  documentName: string;
  clauses: Clause[];
  riskScore: number;
  summary: {
    totalClauses: number;
    riskyClauses: number;
    warnings: number;
    standard: number;
  };
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

// Sample analyzed documents
const SAMPLE_DOCUMENTS: Document[] = [
  { id: '1', name: 'Service Agreement Draft.pdf', type: 'contract', size: '2.4 MB', uploadedAt: '2 hours ago' },
  { id: '2', name: 'NDA_v2.pdf', type: 'nda', size: '890 KB', uploadedAt: '1 day ago' },
  { id: '3', name: 'Employment Contract.pdf', type: 'employment', size: '1.2 MB', uploadedAt: '3 days ago' },
];

const SAMPLE_ANALYSIS: AnalysisResult = {
  documentName: 'Service Agreement Draft.pdf',
  riskScore: 65,
  summary: {
    totalClauses: 24,
    riskyClauses: 3,
    warnings: 5,
    standard: 16,
  },
  clauses: [
    {
      id: '1',
      title: 'Payment Terms',
      content: 'Payment shall be due within 15 days of invoice date. Late payments shall incur interest at 2% per month.',
      type: 'standard',
      page: 3,
    },
    {
      id: '2',
      title: 'Liability Limitation',
      content: 'Service provider liability shall be capped at the total fees paid in the preceding 12 months.',
      type: 'risky',
      page: 4,
    },
    {
      id: '3',
      title: 'Termination Clause',
      content: 'Either party may terminate with 30 days written notice. No early termination fees shall apply.',
      type: 'standard',
      page: 5,
    },
    {
      id: '4',
      title: 'Indemnification',
      content: 'Client shall indemnify service provider against all claims arising from client\'s use of services.',
      type: 'risky',
      page: 4,
    },
    {
      id: '5',
      title: 'Data Usage',
      content: 'Service provider may use anonymized data for improvement purposes.',
      type: 'warning',
      page: 6,
    },
    {
      id: '6',
      title: 'Non-Compete',
      content: 'Client agrees not to engage competitors for 12 months after termination.',
      type: 'negotiable',
      page: 5,
    },
    {
      id: '7',
      title: 'IP Assignment',
      content: 'All work product shall be owned exclusively by service provider.',
      type: 'risky',
      page: 3,
    },
    {
      id: '8',
      title: 'Force Majeure',
      content: 'Neither party liable for delays due to circumstances beyond reasonable control.',
      type: 'standard',
      page: 7,
    },
  ],
};

function App() {
  const [view, setView] = useState<'upload' | 'analysis' | 'compare'>('upload');
  const setViewWithType = (v: 'upload' | 'analysis' | 'compare') => setView(v);
  const [documents, setDocuments] = useState<Document[]>(SAMPLE_DOCUMENTS);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [compareDoc, setCompareDoc] = useState<string>('');

  const analyzeDocument = async () => {
    setAnalyzing(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCurrentAnalysis(SAMPLE_ANALYSIS);
    setView('analysis');
    setAnalyzing(false);
  };

  const getRiskClass = (score: number) => {
    if (score <= 40) return 'low';
    if (score <= 70) return 'medium';
    return 'high';
  };

  return (
    <div className="app">
      <header className="header">
        <h1>
          📄 REZ Contract Intelligence
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setViewWithType('upload')}>
            Upload
          </button>
          <button className="btn btn-secondary" onClick={() => setViewWithType('compare')}>
            Compare
          </button>
        </div>
      </header>

      <main className="main">
        {view === 'upload' && (
          <>
            <div
              className={`upload-zone ${analyzing ? 'dragging' : ''}`}
              onClick={() => !analyzing && analyzeDocument()}
            >
              {analyzing ? (
                <>
                  <div className="spinner"></div>
                  <div className="upload-title">Analyzing Document...</div>
                  <div className="upload-subtitle">Extracting clauses and identifying risks</div>
                </>
              ) : (
                <>
                  <div className="upload-icon">📄</div>
                  <div className="upload-title">Drop documents here</div>
                  <div className="upload-subtitle">
                    Supports PDF, DOCX, TXT up to 50MB
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Documents</h3>
              </div>
              <div className="document-list">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="document-card"
                    onClick={() => {
                      setCurrentAnalysis(SAMPLE_ANALYSIS);
                      setView('analysis');
                    }}
                  >
                    <div className="document-icon">
                      {doc.type === 'contract' && '📝'}
                      {doc.type === 'nda' && '🔒'}
                      {doc.type === 'employment' && '👔'}
                    </div>
                    <div className="document-name">{doc.name}</div>
                    <div className="document-meta">
                      {doc.size} • {doc.uploadedAt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'analysis' && currentAnalysis && (
          <>
            <div className="grid">
              {/* Risk Score */}
              <div className="card risk-score">
                <h3 className="card-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  Overall Risk Score
                </h3>
                <div className={`score-circle ${getRiskClass(currentAnalysis.riskScore)}`}>
                  <div className="score-value">{currentAnalysis.riskScore}</div>
                  <div className="score-label">/ 100</div>
                </div>
                <div className="risk-summary">
                  <div className="risk-item">
                    <div className="risk-value" style={{ color: 'var(--success)' }}>
                      {currentAnalysis.summary.standard}
                    </div>
                    <div className="risk-label">Standard</div>
                  </div>
                  <div className="risk-item">
                    <div className="risk-value" style={{ color: 'var(--error)' }}>
                      {currentAnalysis.summary.riskyClauses}
                    </div>
                    <div className="risk-label">Risky</div>
                  </div>
                  <div className="risk-item">
                    <div className="risk-value" style={{ color: 'var(--warning)' }}>
                      {currentAnalysis.summary.warnings}
                    </div>
                    <div className="risk-label">Warnings</div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="card">
                <h3 className="card-title">Document Summary</h3>
                <div className="summary-grid" style={{ marginTop: '1rem' }}>
                  <div className="summary-item">
                    <span className="summary-label">Document</span>
                    <span className="summary-value">{currentAnalysis.documentName}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Clauses</span>
                    <span className="summary-value">{currentAnalysis.summary.totalClauses}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Pages</span>
                    <span className="summary-value">12</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Parties</span>
                    <span className="summary-value">2</span>
                  </div>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <button className="btn btn-primary" style={{ width: '100%' }}>
                    Generate Report
                  </button>
                </div>
              </div>

              {/* Clauses */}
              <div className="card full-width">
                <h3 className="card-title">Extracted Clauses</h3>
                <div className="clause-list">
                  {currentAnalysis.clauses.map(clause => (
                    <div
                      key={clause.id}
                      className={`clause ${selectedClause?.id === clause.id ? 'selected' : ''}`}
                      onClick={() => setSelectedClause(clause)}
                    >
                      <div className="clause-header">
                        <span className="clause-title">{clause.title}</span>
                        <span className={`clause-type ${clause.type}`}>
                          {clause.type}
                        </span>
                      </div>
                      <div className="clause-content">
                        {clause.content.length > 150
                          ? clause.content.substring(0, 150) + '...'
                          : clause.content}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Page {clause.page}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clause Detail */}
              {selectedClause && (
                <div className="card full-width">
                  <div className="card-header">
                    <h3 className="card-title">{selectedClause.title}</h3>
                    <span className={`clause-type ${selectedClause.type}`}>
                      {selectedClause.type}
                    </span>
                  </div>
                  <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
                    {selectedClause.content}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm">
                      Suggest Alternative
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      Mark as Reviewed
                    </button>
                    <button className="btn btn-primary btn-sm">
                      Add to Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {view === 'compare' && (
          <>
            <div className="grid">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Original Document</h3>
                  <button className="btn btn-secondary btn-sm">Select</button>
                </div>
                <div className="document-panel" style={{ minHeight: '300px' }}>
                  <div className="diff-line unchanged">
                    1. The Provider shall deliver services as per agreed timeline.
                  </div>
                  <div className="diff-line unchanged">
                    2. Payment terms are Net 30 from invoice date.
                  </div>
                  <div className="diff-line removed">
                    3. Liability capped at ₹1,00,000
                  </div>
                  <div className="diff-line removed">
                    4. Client responsible for data backup
                  </div>
                  <div className="diff-line unchanged">
                    5. Term is 12 months from signing date.
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Negotiated Document</h3>
                  <button className="btn btn-secondary btn-sm">Select</button>
                </div>
                <div className="document-panel" style={{ minHeight: '300px' }}>
                  <div className="diff-line unchanged">
                    1. The Provider shall deliver services as per agreed timeline.
                  </div>
                  <div className="diff-line unchanged">
                    2. Payment terms are Net 30 from invoice date.
                  </div>
                  <div className="diff-line added">
                    3. Liability capped at ₹5,00,000 (increased from ₹1L)
                  </div>
                  <div className="diff-line added">
                    3a. Provider responsible for daily data backup
                  </div>
                  <div className="diff-line unchanged">
                    5. Term is 12 months from signing date.
                  </div>
                </div>
              </div>

              <div className="card full-width">
                <h3 className="card-title">Comparison Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                  <div className="summary-item" style={{ flexDirection: 'column', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>2</span>
                    <span className="summary-label">Additions</span>
                  </div>
                  <div className="summary-item" style={{ flexDirection: 'column', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--error)' }}>2</span>
                    <span className="summary-label">Deletions</span>
                  </div>
                  <div className="summary-item" style={{ flexDirection: 'column', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>3</span>
                    <span className="summary-label">Favorable</span>
                  </div>
                  <div className="summary-item" style={{ flexDirection: 'column', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>1</span>
                    <span className="summary-label">Neutral</span>
                  </div>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <button className="btn btn-primary" style={{ width: '100%' }}>
                    Export Comparison Report
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
