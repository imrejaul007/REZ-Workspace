import { useState } from 'react';
import { Agent, AgentTemplate, Skill, KnowledgeSource } from './types';
import { createAgentRegistryClient, type AgentRegistration, type AgentDivision } from '@rez/sdk';

// Agent Templates (Pre-built)
const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'restaurant-agent',
    name: 'Restaurant Agent',
    description: 'Handle orders, reservations, menu queries, and customer support',
    category: 'commerce',
    industry: 'restaurant',
    icon: '🍽️',
    popularity: 100,
    skills: [
      { id: 's1', name: 'Order Taking', description: 'Take food orders', type: 'action', config: {} },
      { id: 's2', name: 'Table Reservations', description: 'Book tables', type: 'action', config: {} },
      { id: 's3', name: 'Menu Recommendations', description: 'Suggest dishes', type: 'query', config: {} },
      { id: 's4', name: 'Dietary Analysis', description: 'Check allergies', type: 'analysis', config: {} },
    ],
    knowledge: [
      { id: 'k1', name: 'Menu Database', type: 'database', config: {} },
      { id: 'k2', name: 'Restaurant Policies', type: 'document', config: {} },
    ],
  },
  {
    id: 'customer-support-agent',
    name: 'Customer Support Agent',
    description: 'Handle complaints, refunds, tracking, and general inquiries',
    category: 'support',
    industry: 'general',
    icon: '🎧',
    popularity: 95,
    skills: [
      { id: 's1', name: 'Complaint Handler', description: 'Process complaints', type: 'action', config: {} },
      { id: 's2', name: 'Refund Processing', description: 'Handle refunds', type: 'action', config: {} },
      { id: 's3', name: 'Order Tracking', description: 'Track shipments', type: 'query', config: {} },
      { id: 's4', name: 'Sentiment Analysis', description: 'Detect customer mood', type: 'analysis', config: {} },
    ],
    knowledge: [
      { id: 'k1', name: 'FAQ Database', type: 'document', config: {} },
      { id: 'k2', name: 'Refund Policies', type: 'document', config: {} },
    ],
  },
  {
    id: 'delivery-agent',
    name: 'Delivery Agent',
    description: 'Route optimization, driver assignment, ETA predictions',
    category: 'logistics',
    industry: 'delivery',
    icon: '🚚',
    popularity: 90,
    skills: [
      { id: 's1', name: 'Route Optimization', description: 'Find best route', type: 'analysis', config: {} },
      { id: 's2', name: 'Driver Assignment', description: 'Assign drivers', type: 'action', config: {} },
      { id: 's3', name: 'ETA Calculation', description: 'Predict delivery time', type: 'query', config: {} },
      { id: 's4', name: 'Delay Detection', description: 'Spot delays early', type: 'analysis', config: {} },
    ],
    knowledge: [
      { id: 'k1', name: 'Map Data', type: 'api', config: {} },
      { id: 'k2', name: 'Driver Pool', type: 'database', config: {} },
    ],
  },
  {
    id: 'loan-agent',
    name: 'Loan Processing Agent',
    description: 'Process applications, check eligibility, approve loans',
    category: 'finance',
    industry: 'finance',
    icon: '💰',
    popularity: 85,
    skills: [
      { id: 's1', name: 'KYC Verification', description: 'Verify documents', type: 'analysis', config: {} },
      { id: 's2', name: 'Credit Check', description: 'Check CIBIL score', type: 'query', config: {} },
      { id: 's3', name: 'Eligibility Check', description: 'Calculate eligibility', type: 'analysis', config: {} },
      { id: 's4', name: 'Disbursement', description: 'Process payment', type: 'action', config: {} },
    ],
    knowledge: [
      { id: 'k1', name: 'Credit Bureau API', type: 'api', config: {} },
      { id: 'k2', name: 'Loan Policies', type: 'document', config: {} },
    ],
  },
  {
    id: 'healthcare-agent',
    name: 'Healthcare Agent',
    description: 'Appointment booking, symptom analysis, health tips',
    category: 'healthcare',
    industry: 'healthcare',
    icon: '🏥',
    popularity: 80,
    skills: [
      { id: 's1', name: 'Appointment Booking', description: 'Schedule visits', type: 'action', config: {} },
      { id: 's2', name: 'Symptom Analysis', description: 'Initial assessment', type: 'analysis', config: {} },
      { id: 's3', name: 'Doctor Matching', description: 'Find specialists', type: 'query', config: {} },
      { id: 's4', name: 'Health Tips', description: 'Provide advice', type: 'generation', config: {} },
    ],
    knowledge: [
      { id: 'k1', name: 'Medical Database', type: 'document', config: {} },
      { id: 'k2', name: 'Doctor Directory', type: 'database', config: {} },
    ],
  },
  {
    id: 'realestate-agent',
    name: 'Real Estate Agent',
    description: 'Property matching, price estimation, tour scheduling',
    category: 'realestate',
    industry: 'realestate',
    icon: '🏠',
    popularity: 75,
    skills: [
      { id: 's1', name: 'Property Matching', description: 'Find best matches', type: 'query', config: {} },
      { id: 's2', name: 'Price Estimation', description: 'Estimate value', type: 'analysis', config: {} },
      { id: 's3', name: 'Tour Scheduling', description: 'Book property visits', type: 'action', config: {} },
      { id: 's4', name: 'Negotiation', description: 'Assist in talks', type: 'action', config: {} },
    ],
    knowledge: [
      { id: 'k1', name: 'Property Listings', type: 'database', config: {} },
      { id: 'k2', name: 'Market Data', type: 'api', config: {} },
    ],
  },
  {
    id: 'hr-agent',
    name: 'HR Agent',
    description: 'Resume screening, interview scheduling, onboarding',
    category: 'hr',
    industry: 'general',
    icon: '👔',
    popularity: 70,
    skills: [
      { id: 's1', name: 'Resume Screening', description: 'Filter candidates', type: 'analysis', config: {} },
      { id: 's2', name: 'Interview Scheduling', description: 'Book interviews', type: 'action', config: {} },
      { id: 's3', name: 'Skill Matching', description: 'Match requirements', type: 'query', config: {} },
      { id: 's4', name: 'Onboarding', description: 'Guide new hires', type: 'action', config: {} },
    ],
    knowledge: [
      { id: 'k1', name: 'Job Requirements', type: 'document', config: {} },
      { id: 'k2', name: 'Candidate Database', type: 'database', config: {} },
    ],
  },
  {
    id: 'marketing-agent',
    name: 'Marketing Agent',
    description: 'Campaign creation, audience targeting, performance analysis',
    category: 'marketing',
    industry: 'general',
    icon: '📢',
    popularity: 65,
    skills: [
      { id: 's1', name: 'Campaign Creation', description: 'Build campaigns', type: 'generation', config: {} },
      { id: 's2', name: 'Audience Targeting', description: 'Find target users', type: 'analysis', config: {} },
      { id: 's3', name: 'A/B Testing', description: 'Run experiments', type: 'analysis', config: {} },
      { id: 's4', name: 'Report Generation', description: 'Create reports', type: 'generation', config: {} },
    ],
    knowledge: [
      { id: 'k1', name: 'User Segments', type: 'database', config: {} },
      { id: 'k2', name: 'Campaign History', type: 'database', config: {} },
    ],
  },
];

// Skill library for adding to agents
const SKILL_LIBRARY: Skill[] = [
  { id: 'lib1', name: 'Data Extraction', description: 'Extract structured data', type: 'action', config: {} },
  { id: 'lib2', name: 'Summarization', description: 'Summarize content', type: 'generation', config: {} },
  { id: 'lib3', name: 'Classification', description: 'Categorize items', type: 'analysis', config: {} },
  { id: 'lib4', name: 'Translation', description: 'Translate text', type: 'action', config: {} },
  { id: 'lib5', name: 'Sentiment Analysis', description: 'Detect emotions', type: 'analysis', config: {} },
  { id: 'lib6', name: 'Entity Recognition', description: 'Find entities', type: 'analysis', config: {} },
  { id: 'lib7', name: 'Content Generation', description: 'Generate text', type: 'generation', config: {} },
  { id: 'lib8', name: 'API Integration', description: 'Call external APIs', type: 'action', config: {} },
];

function App() {
  const [view, setView] = useState<'templates' | 'create' | 'agents'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [currentAgent, setCurrentAgent] = useState<Partial<Agent>>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);

  const createAgentFromTemplate = (template: AgentTemplate) => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: template.name,
      description: template.description,
      category: template.category,
      industry: template.industry,
      skills: [...template.skills],
      knowledge: [...template.knowledge],
      llmModel: 'claude-3-sonnet',
      outputSchema: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentAgent(newAgent);
    setSelectedTemplate(template);
    setView('create');
  };

  const saveAgent = async () => {
    if (!currentAgent.name) return;

    const agent: Agent = {
      ...currentAgent,
      id: currentAgent.id || `agent-${Date.now()}`,
      updatedAt: new Date().toISOString(),
      createdAt: currentAgent.createdAt || new Date().toISOString(),
    } as Agent;

    // Register with REZ Agent Registry
    try {
      const registry = createAgentRegistryClient();
      const registration: AgentRegistration = {
        name: agent.name,
        description: agent.description,
        version: '1.0.0',
        metadata: {
          division: (agent.category as AgentDivision) || 'specialized',
          tags: [agent.industry, agent.category].filter(Boolean),
          capabilities: agent.skills.map(s => s.name),
          languages: ['en'],
          complexity: agent.skills.length > 5 ? 'complex' : 'moderate',
        },
      };

      // If agent already has an ID (existing agent), update it
      // Otherwise register as new
      if (agent.id.startsWith('agent-') && !agent.id.includes('registered')) {
        const registered = await registry.registerAgent(registration);
        agent.id = registered.id;
      }
    } catch (error) {
      console.warn('Registry unavailable, saving locally only:', error);
    }

    setAgents(prev => [...prev.filter(a => a.id !== agent.id), agent]);
    setView('agents');
  };

  const testAgent = async () => {
    if (!testInput || !currentAgent.id) return;
    setTesting(true);
    setTestOutput('');

    // Simulate agent execution with REZ SDK
    try {
      const registry = createAgentRegistryClient();
      const agent = await registry.getAgent(currentAgent.id);
      setTestOutput(JSON.stringify({
        status: 'completed',
        agent: agent.name,
        capabilities: agent.metadata.capabilities,
        input: testInput,
        timestamp: new Date().toISOString(),
      }, null, 2));
    } catch {
      // Fallback to simulation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestOutput(JSON.stringify({
        status: 'completed',
        agent: currentAgent.name,
        input: testInput,
        output: `Processed by ${currentAgent.skills?.length || 0} skills. Knowledge sources consulted: ${currentAgent.knowledge?.length || 0}`,
        timestamp: new Date().toISOString(),
      }, null, 2));
    }
    setTesting(false);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          REZ Agent Builder
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setView('templates')}>
            Templates
          </button>
          <button className="btn btn-primary" onClick={() => setView('create')}>
            + New Agent
          </button>
        </div>
      </header>

      <div className="main" style={{ padding: '1.5rem' }}>
        {/* Templates View */}
        {view === 'templates' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Agent Templates</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Start with a pre-built template and customize for your needs
            </p>
            <div className="template-grid">
              {AGENT_TEMPLATES.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-icon">{template.icon}</div>
                  <div className="template-name">{template.name}</div>
                  <div className="template-description">{template.description}</div>
                  <div className="skills-list">
                    {template.skills.slice(0, 3).map(skill => (
                      <span key={skill.id} className="skill-badge">{skill.name}</span>
                    ))}
                    {template.skills.length > 3 && (
                      <span className="skill-badge">+{template.skills.length - 3}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <span className="tag">{template.industry}</span>
                    <span className="tag">{template.popularity}% used</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                    onClick={() => createAgentFromTemplate(template)}
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create/Edit Agent View */}
        {view === 'create' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
            <div>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Agent Configuration</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => setView('templates')}>
                    Back
                  </button>
                </div>

                <div className="form-group">
                  <label>Agent Name</label>
                  <input
                    type="text"
                    value={currentAgent.name || ''}
                    onChange={e => setCurrentAgent({ ...currentAgent, name: e.target.value })}
                    placeholder="My Custom Agent"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={currentAgent.description || ''}
                    onChange={e => setCurrentAgent({ ...currentAgent, description: e.target.value })}
                    placeholder="What does this agent do?"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Industry</label>
                  <select
                    value={currentAgent.industry || ''}
                    onChange={e => setCurrentAgent({ ...currentAgent, industry: e.target.value })}
                  >
                    <option value="">Select Industry</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="retail">Retail</option>
                    <option value="realestate">Real Estate</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>LLM Model</label>
                  <select
                    value={currentAgent.llmModel || 'claude-3-sonnet'}
                    onChange={e => setCurrentAgent({ ...currentAgent, llmModel: e.target.value })}
                  >
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </select>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Skills ({currentAgent.skills?.length || 0})</h3>
                </div>
                <div className="skills-list">
                  {currentAgent.skills?.map(skill => (
                    <span key={skill.id} className="skill-badge">
                      {skill.name}
                      <button
                        style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                        onClick={() => setCurrentAgent({
                          ...currentAgent,
                          skills: currentAgent.skills?.filter(s => s.id !== skill.id)
                        })}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <select
                    value=""
                    onChange={e => {
                      const skill = SKILL_LIBRARY.find(s => s.id === e.target.value);
                      if (skill && !currentAgent.skills?.find(s => s.id === skill.id)) {
                        setCurrentAgent({
                          ...currentAgent,
                          skills: [...(currentAgent.skills || []), skill]
                        });
                      }
                    }}
                  >
                    <option value="">Add Skill...</option>
                    {SKILL_LIBRARY.filter(s => !currentAgent.skills?.find(cs => cs.id === s.id)).map(skill => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Knowledge Sources ({currentAgent.knowledge?.length || 0})</h3>
                </div>
                <div className="skills-list">
                  {currentAgent.knowledge?.map(k => (
                    <span key={k.id} className="skill-badge" style={{ background: 'var(--secondary)' }}>
                      {k.name}
                      <button
                        style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                        onClick={() => setCurrentAgent({
                          ...currentAgent,
                          knowledge: currentAgent.knowledge?.filter(kn => kn.id !== k.id)
                        })}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={saveAgent}>
                  Save Agent
                </button>
                <button className="btn btn-secondary" onClick={() => setView('agents')}>
                  Cancel
                </button>
              </div>
            </div>

            {/* Test Panel */}
            <div className="card" style={{ height: 'fit-content' }}>
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>Test Agent</h3>
              <div className="form-group">
                <label>Input</label>
                <textarea
                  value={testInput}
                  onChange={e => setTestInput(e.target.value)}
                  placeholder="Enter test input..."
                  rows={4}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={testAgent}
                disabled={testing || !testInput}
              >
                {testing ? 'Testing...' : 'Run Agent'}
              </button>
              {testOutput && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Output</label>
                  <pre style={{
                    background: 'var(--bg)',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {testOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agents List View */}
        {view === 'agents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>My Agents ({agents.length})</h2>
              <button className="btn btn-primary" onClick={() => setView('create')}>
                + Create Agent
              </button>
            </div>

            {agents.length === 0 ? (
              <div className="empty-state">
                <h3>No agents yet</h3>
                <p>Create your first agent using a template</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setView('templates')}>
                  Browse Templates
                </button>
              </div>
            ) : (
              <div className="agent-grid">
                {agents.map(agent => (
                  <div key={agent.id} className="agent-card">
                    <div className="agent-icon">
                      {agent.industry === 'restaurant' && '🍽️'}
                      {agent.industry === 'finance' && '💰'}
                      {agent.industry === 'healthcare' && '🏥'}
                      {agent.industry === 'realestate' && '🏠'}
                      {agent.industry === 'general' && '🤖'}
                    </div>
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-description">{agent.description}</div>
                    <div className="agent-meta">
                      <span className="tag">{agent.skills.length} skills</span>
                      <span className={`status-badge ${agent.status}`}>{agent.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => {
                          setCurrentAgent(agent);
                          setView('create');
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => {
                          setCurrentAgent(agent);
                          setTestInput('Test input for ' + agent.name);
                          setView('create');
                        }}
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
