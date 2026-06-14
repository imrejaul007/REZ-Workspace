import { useState } from 'react';

interface Props {
  onSave: (data: { content: string; title?: string; tags?: string[]; type?: string }) => void;
  onClose: () => void;
}

export default function MemoryForm({ onSave, onClose }: Props) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [type, setType] = useState('note');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    await onSave({
      content: content.trim(),
      title: title.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      type,
    });
    setSaving(false);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Memory</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem',
                color: 'var(--text)',
                fontSize: '1rem',
              }}
            >
              <option value="note">Note</option>
              <option value="page">Web Page</option>
              <option value="highlight">Highlight</option>
              <option value="link">Link</option>
              <option value="chat">Chat</option>
            </select>
          </div>
          <div className="form-group">
            <label>Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give this memory a title..."
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What do you want to remember?"
              required
            />
          </div>
          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="work, ideas, important"
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !content.trim()}>
              {saving ? 'Saving...' : 'Save Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
