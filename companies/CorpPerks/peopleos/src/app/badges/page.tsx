'use client';

const badges = [
  { id: '1', name: 'Attendance Champion', icon: '🏆', desc: '100% attendance 30 days', earned: true },
  { id: '2', name: 'Team Player', icon: '🤝', desc: 'Helped 10 colleagues', earned: true },
  { id: '3', name: 'Problem Solver', icon: '🧩', desc: 'Resolved 20 bugs', earned: false },
  { id: '4', name: 'Goal Crusher', icon: '🎯', desc: 'All OKRs achieved', earned: false },
  { id: '5', name: 'Helping Hand', icon: '🙌', desc: '50+ helpful actions', earned: false },
  { id: '6', name: 'Streak Master', icon: '🔥', desc: '30-day streak', earned: false },
];

export default function BadgesPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Badges & Achievements</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Collect badges, unlock rewards</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', padding: 20, borderRadius: 12, color: 'white' }}>
          <p style={{ fontSize: 12, margin: 0 }}>Earned</p>
          <p style={{ fontSize: 32, fontWeight: 700, margin: '8px 0 0' }}>2</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Locked</p>
          <p style={{ fontSize: 32, fontWeight: 700, margin: '8px 0 0' }}>4</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Total Badges</p>
          <p style={{ fontSize: 32, fontWeight: 700, margin: '8px 0 0', color: '#8b5cf6' }}>{badges.length}</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Progress</p>
          <p style={{ fontSize: 32, fontWeight: 700, margin: '8px 0 0', color: '#10b981' }}>25%</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {badges.map(badge => (
          <div key={badge.id} style={{
            background: badge.earned ? '#fef3c7' : '#f9fafb',
            padding: 20, borderRadius: 12, textAlign: 'center',
            border: badge.earned ? '2px solid #fbbf24' : '2px solid #e5e7eb',
            opacity: badge.earned ? 1 : 0.6
          }}>
            <span style={{ fontSize: 48, filter: badge.earned ? 'none' : 'grayscale(100%)' }}>{badge.icon}</span>
            <h3 style={{ margin: '12px 0 4px' }}>{badge.name}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{badge.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
