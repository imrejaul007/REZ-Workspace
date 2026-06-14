import { useState, useEffect } from 'react';
import { REZMemoryClient, GraphResponse, MemoryResponse } from '@rez/memory-client';

interface Props {
  userId: string;
  client: REZMemoryClient;
}

export default function GraphView({ userId, client }: Props) {
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeMemories, setNodeMemories] = useState<MemoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.getGraph(userId)
      .then(setGraph)
      .catch(() => setGraph(null))
      .finally(() => setLoading(false));
  }, [userId, client]);

  async function handleNodeClick(nodeId: string) {
    setSelectedNode(nodeId);
    try {
      const memories = await client.getEntityMemories(userId, nodeId);
      setNodeMemories(memories);
    } catch {
      setNodeMemories([]);
    }
  }

  if (loading) {
    return <div className="loading">Loading knowledge graph...</div>;
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="empty-state">
        <h3>No knowledge graph yet</h3>
        <p>Save memories to build your knowledge graph</p>
      </div>
    );
  }

  const colors: Record<string, string> = {
    person: '#10B981',
    concept: '#6366F1',
    topic: '#F59E0B',
    entity: '#8B5CF6',
  };

  return (
    <div>
      <div className="graph-container">
        <h3 style={{ marginBottom: '1rem' }}>Knowledge Graph</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {graph.nodes.map(node => (
            <button
              key={node.id}
              className="graph-node"
              style={{ background: colors[node.type] || 'var(--primary)' }}
              onClick={() => handleNodeClick(node.id)}
            >
              {node.name} ({node.memoryCount})
            </button>
          ))}
        </div>
        {graph.edges.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Connections: {graph.edges.length}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {graph.edges.slice(0, 10).map((edge, i) => (
                <span key={i} className="tag">
                  {edge.type}
                </span>
              ))}
              {graph.edges.length > 10 && (
                <span className="tag">+{graph.edges.length - 10} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedNode && (
        <div className="graph-container" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Memories for selected entity</h3>
            <button className="btn btn-secondary" onClick={() => setSelectedNode(null)}>Close</button>
          </div>
          {nodeMemories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No memories found</p>
          ) : (
            <div className="memories-grid">
              {nodeMemories.map(memory => (
                <div key={memory.id} className="memory-card">
                  <div className="memory-card-title">
                    {memory.title || memory.content.substring(0, 50)}
                  </div>
                  <div className="memory-card-content">
                    {memory.content.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
