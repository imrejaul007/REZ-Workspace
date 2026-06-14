'use client';

export default function Feedback360Page() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>360 Feedback</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Collect anonymous feedback from peers, managers, and reports</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Pending', value: 5 },
          { label: 'In Progress', value: 3 },
          { label: 'Completed', value: 12 },
          { label: 'Anonymity', value: '100%' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
        <h2 style={{ marginBottom: 16 }}>Give Feedback</h2>
        <select style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }}>
          <option>Select Employee</option>
          <option>Priya Sharma</option>
          <option>Rahul Verma</option>
        </select>
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8, fontWeight: 500 }}>Rating</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>{n}</button>
            ))}
          </div>
        </div>
        <textarea placeholder="Your feedback..." rows={4} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16, resize: 'vertical' }} />
        <button style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          Submit Anonymously
        </button>
      </div>
    </div>
  );
}
