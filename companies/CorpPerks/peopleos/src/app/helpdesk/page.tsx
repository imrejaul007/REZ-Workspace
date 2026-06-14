'use client';

const tickets = [
  { id: 1, subject: 'Salary discrepancy May', priority: 'high', status: 'open', assignee: 'HR Team', created: '2h ago' },
  { id: 2, subject: 'Laptop issue - not working', priority: 'medium', status: 'in_progress', assignee: 'IT Support', created: '4h ago' },
  { id: 3, subject: 'Leave balance query', priority: 'low', status: 'resolved', assignee: 'HR Team', created: '1d ago' },
];

export default function HelpdeskPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>HR Helpdesk</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Employee support tickets and SLA tracking</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Open', value: 5, color: '#ef4444' },
          { label: 'In Progress', value: 3, color: '#f59e0b' },
          { label: 'Resolved', value: 12, color: '#10b981' },
          { label: 'SLA Breach', value: 1, color: '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 32, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 16px' }}>Raise Ticket</h2>
        <input placeholder="Subject" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
        <select style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }}>
          <option>Category</option>
          <option>Payroll</option>
          <option>IT Support</option>
          <option>HR Query</option>
          <option>Facilities</option>
        </select>
        <textarea placeholder="Description" rows={3} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }} />
        <select style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }}>
          <option>Priority</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Urgent</option>
        </select>
        <button style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Submit Ticket</button>
      </div>

      <div style={{ background: 'white', borderRadius: 12 }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0 }}>Tickets</h2>
        </div>
        {tickets.map(ticket => (
          <div key={ticket.id} style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, margin: 0 }}>#{ticket.id} - {ticket.subject}</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Assigned: {ticket.assignee} • {ticket.created}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, background: ticket.priority === 'high' ? '#fee2e2' : '#fef3c7', color: ticket.priority === 'high' ? '#dc2626' : '#b45309' }}>{ticket.priority}</span>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, background: ticket.status === 'open' ? '#fee2e2' : ticket.status === 'in_progress' ? '#fef3c7' : '#dcfce7', color: ticket.status === 'open' ? '#dc2626' : ticket.status === 'in_progress' ? '#b45309' : '#15803d' }}>{ticket.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
