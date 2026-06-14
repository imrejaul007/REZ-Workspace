import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { WorkflowTemplate, Workflow, FlowNodeData } from './types';

// Custom Node Component
function WorkflowNode({ data, type }: { data: FlowNodeData; type: string }) {
  const colors: Record<string, string> = {
    trigger: '#10B981',
    action: '#6366F1',
    condition: '#F59E0B',
    delay: '#06B6D4',
    ai_agent: '#8B5CF6',
  };

  return (
    <div
      style={{
        background: colors[type] || '#6366F1',
        color: 'white',
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        minWidth: '150px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#fff' }} />
      <div>{data.label}</div>
      {data.description && (
        <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
          {data.description}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ background: '#fff' }} />
    </div>
  );
}

const nodeTypes = {
  trigger: WorkflowNode,
  action: WorkflowNode,
  condition: WorkflowNode,
  delay: WorkflowNode,
  ai_agent: WorkflowNode,
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4045';

// Industry Templates
const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'restaurant-order',
    name: 'Restaurant Order',
    description: 'Order → Kitchen → Delivery → Payment',
    category: 'commerce',
    industry: 'restaurant',
    popularity: 100,
    trigger: { type: 'event', config: {} },
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'New Order', description: 'Triggered on new order' } },
      { id: 'n2', type: 'action', position: { x: 200, y: 100 }, data: { label: 'Send to Kitchen', description: 'Push to kitchen display' } },
      { id: 'n3', type: 'delay', position: { x: 400, y: 100 }, data: { label: 'Wait 15 min', description: 'Average prep time' } },
      { id: 'n4', type: 'action', position: { x: 600, y: 100 }, data: { label: 'Assign Driver', description: 'Find available driver' } },
      { id: 'n5', type: 'action', position: { x: 800, y: 100 }, data: { label: 'Collect Payment', description: 'Process payment' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ],
  },
  {
    id: 'healthcare-appointment',
    name: 'Healthcare Appointment',
    description: 'Book → Reminder → Check-in → Treatment',
    category: 'healthcare',
    industry: 'healthcare',
    popularity: 90,
    trigger: { type: 'schedule', config: {} },
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'Appointment Booked', description: 'New booking created' } },
      { id: 'n2', type: 'action', position: { x: 200, y: 100 }, data: { label: 'Send Confirmation', description: 'Email + SMS' } },
      { id: 'n3', type: 'delay', position: { x: 400, y: 100 }, data: { label: 'Remind 24h', description: 'Day before reminder' } },
      { id: 'n4', type: 'action', position: { x: 600, y: 100 }, data: { label: 'Check-in', description: 'Patient arrival' } },
      { id: 'n5', type: 'action', position: { x: 800, y: 100 }, data: { label: 'Start Treatment', description: 'Begin consultation' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ],
  },
  {
    id: 'finance-loan',
    name: 'Loan Application',
    description: 'Apply → Underwrite → Approve → Disburse',
    category: 'finance',
    industry: 'finance',
    popularity: 85,
    trigger: { type: 'api', config: {} },
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'Application', description: 'New loan application' } },
      { id: 'n2', type: 'ai_agent', position: { x: 200, y: 100 }, data: { label: 'Document Check', description: 'Verify KYC docs' } },
      { id: 'n3', type: 'action', position: { x: 400, y: 100 }, data: { label: 'Credit Check', description: 'CIBIL score check' } },
      { id: 'n4', type: 'condition', position: { x: 600, y: 100 }, data: { label: 'Score >= 700?', description: 'Credit score check' } },
      { id: 'n5', type: 'action', position: { x: 800, y: 50 }, data: { label: 'Approve', description: 'Loan approved' } },
      { id: 'n6', type: 'action', position: { x: 800, y: 150 }, data: { label: 'Reject', description: 'Loan rejected' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5', label: 'Yes' },
      { id: 'e5', source: 'n4', target: 'n6', label: 'No' },
    ],
  },
  {
    id: 'retail-order',
    name: 'Retail Order',
    description: 'Browse → Cart → Order → Fulfill → Delivered',
    category: 'commerce',
    industry: 'retail',
    popularity: 95,
    trigger: { type: 'event', config: {} },
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'Order Placed', description: 'New retail order' } },
      { id: 'n2', type: 'action', position: { x: 200, y: 100 }, data: { label: 'Confirm Stock', description: 'Check inventory' } },
      { id: 'n3', type: 'action', position: { x: 400, y: 100 }, data: { label: 'Pick & Pack', description: 'Prepare shipment' } },
      { id: 'n4', type: 'action', position: { x: 600, y: 100 }, data: { label: 'Ship Order', description: 'Hand to courier' } },
      { id: 'n5', type: 'action', position: { x: 800, y: 100 }, data: { label: 'Notify Customer', description: 'Delivery update' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ],
  },
  {
    id: 'hr-onboarding',
    name: 'Employee Onboarding',
    description: 'Hire → Docs → Setup → Train → Live',
    category: 'hr',
    industry: 'general',
    popularity: 80,
    trigger: { type: 'api', config: {} },
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'New Hire', description: 'Offer accepted' } },
      { id: 'n2', type: 'action', position: { x: 200, y: 100 }, data: { label: 'Collect Docs', description: 'KYC & certificates' } },
      { id: 'n3', type: 'action', position: { x: 400, y: 100 }, data: { label: 'Setup Systems', description: 'Email, tools access' } },
      { id: 'n4', type: 'action', position: { x: 600, y: 100 }, data: { label: 'Send Training', description: 'Welcome materials' } },
      { id: 'n5', type: 'action', position: { x: 800, y: 100 }, data: { label: 'Day 1 Ready', description: 'Start onboarding' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ],
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    description: 'Launch → Segment → Send → Track → Optimize',
    category: 'marketing',
    industry: 'general',
    popularity: 75,
    trigger: { type: 'schedule', config: {} },
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'Campaign Start', description: 'Scheduled trigger' } },
      { id: 'n2', type: 'action', position: { x: 200, y: 100 }, data: { label: 'Segment Users', description: 'Filter target audience' } },
      { id: 'n3', type: 'action', position: { x: 400, y: 100 }, data: { label: 'Send Campaign', description: 'Email/WhatsApp/SMS' } },
      { id: 'n4', type: 'ai_agent', position: { x: 600, y: 100 }, data: { label: 'Track Response', description: 'Monitor engagement' } },
      { id: 'n5', type: 'condition', position: { x: 800, y: 100 }, data: { label: 'CTR > 5%?', description: 'Check performance' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ],
  },
];

// Node definitions for sidebar
const NODE_DEFINITIONS = [
  { type: 'trigger', label: 'Trigger', icon: '⚡', description: 'Start of workflow' },
  { type: 'action', label: 'Action', icon: '🎯', description: 'Perform an action' },
  { type: 'condition', label: 'Condition', icon: '🔀', description: 'Branch logic' },
  { type: 'delay', label: 'Delay', icon: '⏱️', description: 'Wait period' },
  { type: 'ai_agent', label: 'AI Agent', icon: '🤖', description: 'AI processing' },
];

function App() {
  const [activeTab, setActiveTab] = useState<'canvas' | 'templates' | 'runs'>('canvas');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);

  // Load workflows
  useEffect(() => {
    fetch(`${API_URL}/api/workflows`)
      .then(res => res.json())
      .then(data => setWorkflows(Array.isArray(data) ? data : []))
      .catch(() => setWorkflows([]));
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const createNewWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `wf-${Date.now()}`,
      name: 'New Workflow',
      description: '',
      nodes: [],
      edges: [],
      trigger: { type: 'manual', config: {} },
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentWorkflow(newWorkflow);
    setNodes([]);
    setEdges([]);
  };

  const loadTemplate = (template: WorkflowTemplate) => {
    const workflow: Workflow = {
      id: `wf-${Date.now()}`,
      name: template.name,
      description: template.description,
      nodes: template.nodes,
      edges: template.edges,
      trigger: template.trigger,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentWorkflow(workflow);
    setActiveTab('canvas');

    // Convert to React Flow nodes/edges
    const flowNodes: Node[] = template.nodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: { label: n.data.label, description: n.data.description },
    }));
    const flowEdges: Edge[] = template.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: true,
    }));
    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const saveWorkflow = async () => {
    if (!currentWorkflow) return;
    setLoading(true);
    try {
      const workflowData = {
        ...currentWorkflow,
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
        })),
      };

      const response = await fetch(`${API_URL}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData),
      });

      if (response.ok) {
        const saved = await response.json();
        setCurrentWorkflow(saved);
        setWorkflows(prev => [...prev.filter(w => w.id !== saved.id), saved]);
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async () => {
    if (!currentWorkflow) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/workflows/${currentWorkflow.id}/execute`, {
        method: 'POST',
      });
      alert('Workflow executed!');
    } catch (error) {
      console.error('Execute failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: `New ${type}`, description: '' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateSelectedNode = (label: string) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id ? { ...n, data: { ...n.data, label } } : n
      )
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setSelectedNode(null);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          REZ Workflow Builder
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={createNewWorkflow}>+ New</button>
          <button className="btn btn-primary" onClick={saveWorkflow} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button className="btn btn-success" onClick={executeWorkflow} disabled={loading || !currentWorkflow}>
            ▶ Run
          </button>
        </div>
      </header>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Workflow name..."
          value={currentWorkflow?.name || ''}
          onChange={(e) => setCurrentWorkflow(prev => prev ? { ...prev, name: e.target.value } : null)}
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            color: 'var(--text)',
            width: '300px',
          }}
        />
        {currentWorkflow && (
          <span className={`status-badge ${currentWorkflow.status}`}>
            {currentWorkflow.status}
          </span>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'canvas' ? 'active' : ''}`} onClick={() => setActiveTab('canvas')}>
          Canvas
        </button>
        <button className={`tab ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
          Templates
        </button>
        <button className={`tab ${activeTab === 'runs' ? 'active' : ''}`} onClick={() => setActiveTab('runs')}>
          Runs
        </button>
      </div>

      <div className="main-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Node Types</span>
          </div>
          <div className="sidebar-content">
            <div className="sidebar-section">
              <h3>Drag to Canvas</h3>
              {NODE_DEFINITIONS.map((node) => (
                <div
                  key={node.type}
                  className="node-item"
                  onClick={() => addNode(node.type)}
                >
                  <div className={`node-icon ${node.type}`}>{node.icon}</div>
                  <div>
                    <div className="node-label">{node.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {node.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sidebar-section">
              <h3>My Workflows</h3>
              {workflows.length === 0 ? (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  No workflows yet
                </div>
              ) : (
                <div className="workflow-list">
                  {workflows.slice(0, 5).map((wf) => (
                    <div
                      key={wf.id}
                      className={`workflow-item ${currentWorkflow?.id === wf.id ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentWorkflow(wf);
                        // Load nodes/edges from workflow
                        const flowNodes: Node[] = (wf as unknown as { nodes?: Node[] })?.nodes || [];
                        const flowEdges: Edge[] = (wf as unknown as { edges?: Edge[] })?.edges || [];
                        setNodes(flowNodes);
                        setEdges(flowEdges);
                      }}
                    >
                      <div className="workflow-name">{wf.name}</div>
                      <div className="workflow-meta">
                        <span className={`status-badge ${wf.status}`}>{wf.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="canvas-container">
          {activeTab === 'canvas' && (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              style={{ background: 'var(--bg)' }}
            >
              <Controls />
              <Background />
            </ReactFlow>
          )}

          {activeTab === 'templates' && (
            <div style={{ padding: '2rem', overflow: 'auto' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Industry Workflow Templates</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {TEMPLATES.map((template) => (
                  <div key={template.id} className="template-card" style={{ padding: '1.5rem' }}>
                    <div className="template-icon">
                      {template.industry === 'restaurant' && '🍽️'}
                      {template.industry === 'healthcare' && '🏥'}
                      {template.industry === 'finance' && '💰'}
                      {template.industry === 'retail' && '🛒'}
                      {template.industry === 'general' && '⚙️'}
                    </div>
                    <div className="template-name">{template.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      {template.description}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                      <span className="tag" style={{ textTransform: 'capitalize' }}>{template.industry}</span>
                      <span className="tag">{template.nodes.length} steps</span>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '1rem' }}
                      onClick={() => loadTemplate(template)}
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'runs' && (
            <div style={{ padding: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Workflow Runs</h2>
              <div className="empty-state">
                <p>No executions yet. Run a workflow to see results here.</p>
              </div>
            </div>
          )}
        </div>

        {selectedNode && (
          <aside className="properties-panel">
            <div className="properties-header">
              <h3>Node Properties</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedNode(null)}>×</button>
            </div>
            <div className="properties-content">
              <div className="form-group">
                <label>Label</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => updateSelectedNode(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <input type="text" value={selectedNode.type} disabled />
              </div>
              <div className="form-group">
                <label>Node ID</label>
                <input type="text" value={selectedNode.id} disabled />
              </div>
              <div style={{ marginTop: '2rem' }}>
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={deleteSelectedNode}>
                  🗑️ Delete Node
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;
