export default function CalibrationPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Performance Calibration</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Align performance ratings across managers</p>

      <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Current Cycle: Q2 2026</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {['Below', 'Meets', 'Exceeds', 'Outstanding', 'Needs Action'].map((rating, i) => (
            <div key={rating} style={{ padding: 16, background: i === 2 ? '#fef3c7' : '#f9fafb', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{rating}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Target: {['5%', '60%', '25%', '8%', '2%'][i]}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
        <h2 style={{ marginBottom: 16 }}>Calibration Matrix</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Employee</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Self Rating</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Manager Rating</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Priya Sharma', self: 4, manager: 4, status: 'aligned' },
                { name: 'Rahul Verma', self: 5, manager: 3, status: 'review' },
                { name: 'Sneha Patel', self: 3, manager: 3, status: 'aligned' },
              ].map((emp, i) => (
                <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 12, fontWeight: 500 }}>{emp.name}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{emp.self}/5</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{emp.manager}/5</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12,
                      background: emp.status === 'aligned' ? '#dcfce7' : '#fef3c7', color: emp.status === 'aligned' ? '#15803d' : '#b45309'
                    }}>
                      {emp.status === 'aligned' ? 'Aligned' : 'Review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
