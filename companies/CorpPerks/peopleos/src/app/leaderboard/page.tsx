const leaders = [
  { rank: 1, name: 'Priya Sharma', dept: 'Engineering', score: 2450 },
  { rank: 2, name: 'Rahul Verma', dept: 'Sales', score: 2380 },
  { rank: 3, name: 'Sneha Patel', dept: 'Marketing', score: 2250 },
  { rank: 4, name: 'Amit Kumar', dept: 'Operations', score: 2100 },
  { rank: 5, name: 'Neha Gupta', dept: 'HR', score: 1980 },
  { rank: 6, name: 'Vikram Singh', dept: 'Engineering', score: 1850 },
];

export default function LeaderboardPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Leaderboard</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Top performers this week</p>

      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: 12, textAlign: 'left', color: '#6b7280' }}>Rank</th>
              <th style={{ padding: 12, textAlign: 'left', color: '#6b7280' }}>Employee</th>
              <th style={{ padding: 12, textAlign: 'left', color: '#6b7280' }}>Department</th>
              <th style={{ padding: 12, textAlign: 'right', color: '#6b7280' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((l, i) => (
              <tr key={l.rank} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: 16 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                    background: i === 0 ? '#fbbf24' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#e5e7eb',
                    color: i < 3 ? 'white' : '#6b7280'
                  }}>
                    {l.rank}
                  </span>
                </td>
                <td style={{ padding: 16, fontWeight: 500 }}>{l.name}</td>
                <td style={{ padding: 16, color: '#6b7280' }}>{l.dept}</td>
                <td style={{ padding: 16, textAlign: 'right', fontWeight: 600 }}>{l.score.toLocaleString()} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
