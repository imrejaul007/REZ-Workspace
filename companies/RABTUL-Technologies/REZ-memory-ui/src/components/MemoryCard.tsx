import { MemoryResponse } from '@rez/memory-client';

interface Props {
  memory: MemoryResponse;
  onClick: () => void;
  onDelete: () => void;
}

export default function MemoryCard({ memory, onClick, onDelete }: Props) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this memory?')) {
      onDelete();
    }
  };

  return (
    <div className="memory-card" onClick={onClick}>
      <div className="memory-card-header">
        <div className="memory-card-title">
          {memory.title || memory.content.substring(0, 50) + '...'}
        </div>
        <span className="memory-card-type">{memory.type}</span>
      </div>
      <div className="memory-card-content">
        {memory.content.length > 150 ? memory.content.substring(0, 150) + '...' : memory.content}
      </div>
      <div className="memory-card-meta">
        {memory.tags.slice(0, 3).map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
        {memory.tags.length > 3 && (
          <span className="tag">+{memory.tags.length - 3}</span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {new Date(memory.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={handleDelete}
          style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
