import { useState, useEffect } from 'react';
import { REZMemoryClient, MemoryResponse } from '@rez/memory-client';
import MemoryCard from './components/MemoryCard';
import MemoryForm from './components/MemoryForm';
import SearchBar from './components/SearchBar';
import StatsPanel from './components/StatsPanel';
import GraphView from './components/GraphView';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4210';
const USER_ID = import.meta.env.VITE_USER_ID || 'default-user';

const client = new REZMemoryClient({ apiUrl: API_URL });

function App() {
  const [memories, setMemories] = useState<MemoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemoryResponse[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryResponse | null>(null);
  const [view, setView] = useState<'memories' | 'graph'>('memories');

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    setLoading(true);
    setError(null);
    try {
      const result = await client.listMemories(USER_ID, { limit: 50 });
      setMemories(result.memories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const response = await client.search({ query, userId: USER_ID, limit: 20 });
      setSearchResults(response.results.map(r => r.memory));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function handleSaveMemory(data: { content: string; title?: string; tags?: string[]; type?: string }) {
    try {
      await client.remember({
        userId: USER_ID,
        content: data.content,
        title: data.title,
        tags: data.tags,
        type: data.type as 'page' | 'note' | 'chat' | 'highlight' | 'link',
      });
      setShowForm(false);
      loadMemories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save memory');
    }
  }

  async function handleDeleteMemory(id: string) {
    try {
      await client.forget(id, USER_ID);
      setMemories(prev => prev.filter(m => m.id !== id));
      setSelectedMemory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
    }
  }

  const displayMemories = searchResults ?? memories;

  return (
    <div className="app">
      <header className="header">
        <h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" />
            <path d="M12 6v6l4 2" />
          </svg>
          REZ Memory
        </h1>
        <div className="btn-group">
          <button
            className={`btn ${view === 'memories' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('memories')}
          >
            Memories
          </button>
          <button
            className={`btn ${view === 'graph' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('graph')}
          >
            Knowledge Graph
          </button>
        </div>
      </header>

      <main className="main">
        <aside className="sidebar">
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ width: '100%' }}>
            + New Memory
          </button>

          <SearchBar onSearch={handleSearch} loading={searching} />

          <StatsPanel userId={USER_ID} client={client} />

          <div className="sidebar-section">
            <h3>Quick Filters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['page', 'note', 'highlight', 'link'].map(type => (
                <button
                  key={type}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', textTransform: 'capitalize' }}
                  onClick={() => handleSearch(`type:${type}`)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="content">
          {error && <div className="error">{error}</div>}

          {view === 'memories' ? (
            <>
              {searchQuery && (
                <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {searchResults?.length ?? 0} results for "{searchQuery}"
                </div>
              )}

              {loading ? (
                <div className="loading">Loading memories...</div>
              ) : displayMemories.length === 0 ? (
                <div className="empty-state">
                  <h3>{searchQuery ? 'No results found' : 'No memories yet'}</h3>
                  <p>{searchQuery ? 'Try a different search term' : 'Click "New Memory" to save your first memory'}</p>
                </div>
              ) : (
                <div className="memories-grid">
                  {displayMemories.map(memory => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      onClick={() => setSelectedMemory(memory)}
                      onDelete={() => handleDeleteMemory(memory.id)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <GraphView userId={USER_ID} client={client} />
          )}
        </section>
      </main>

      {showForm && (
        <MemoryForm
          onSave={handleSaveMemory}
          onClose={() => setShowForm(false)}
        />
      )}

      {selectedMemory && (
        <div className="modal" onClick={() => setSelectedMemory(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedMemory.title || 'Memory'}</h2>
              <button className="modal-close" onClick={() => setSelectedMemory(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="memory-card-meta" style={{ marginBottom: '1rem' }}>
                <span className="memory-card-type">{selectedMemory.type}</span>
                {selectedMemory.url && (
                  <a href={selectedMemory.url} target="_blank" rel="noopener noreferrer" className="tag">
                    Source
                  </a>
                )}
              </div>
              <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{selectedMemory.content}</p>
              {selectedMemory.tags.length > 0 && (
                <div className="memory-card-meta">
                  {selectedMemory.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Created: {new Date(selectedMemory.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedMemory(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => {
                navigator.clipboard.writeText(selectedMemory.content);
              }}>Copy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
