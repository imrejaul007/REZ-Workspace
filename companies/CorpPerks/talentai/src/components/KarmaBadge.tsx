'use client';

interface KarmaBadgeProps {
  karma: {
    lifetimeKarma: number;
    level: string;
    trustScore: number;
    badges: { name: string; icon?: string }[];
  } | null;
  compact?: boolean;
}

export default function KarmaBadge({ karma, compact = false }: KarmaBadgeProps) {
  if (!karma) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: compact ? '4px 8px' : '8px 16px',
        background: '#f3f4f6',
        borderRadius: '20px',
        fontSize: compact ? '11px' : '13px',
      }}>
        <span>🆕</span>
        <span style={{ color: '#6b7280' }}>New</span>
      </div>
    );
  }

  const getTierInfo = () => {
    if (karma.lifetimeKarma >= 10000 || karma.level === 'elite') {
      return { tier: 'Elite', icon: '👑', color: '#ffd700' };
    }
    if (karma.lifetimeKarma >= 5000 || karma.level === 'leader') {
      return { tier: 'Leader', icon: '⭐', color: '#8b5cf6' };
    }
    if (karma.lifetimeKarma >= 1000 || karma.level === 'contributor') {
      return { tier: 'Contributor', icon: '🌟', color: '#10b981' };
    }
    if (karma.lifetimeKarma >= 100 || karma.level === 'active') {
      return { tier: 'Active', icon: '🔥', color: '#3b82f6' };
    }
    return { tier: 'Starter', icon: '🌱', color: '#6b7280' };
  };

  const tier = getTierInfo();

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        background: `${tier.color}20`,
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 500,
        color: tier.color,
      }}>
        <span>{tier.icon}</span>
        <span>{karma.lifetimeKarma.toLocaleString()} Karma</span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      background: 'white',
      borderRadius: '12px',
      border: `2px solid ${tier.color}40`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${tier.color} 0%, ${tier.color}80 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
        }}>
          {tier.icon}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: tier.color }}>{tier.tier}</span>
            <span style={{
              padding: '2px 8px',
              background: `${tier.color}20`,
              borderRadius: '10px',
              fontSize: '11px',
              color: tier.color,
            }}>
              {karma.level}
            </span>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0 0' }}>
            {karma.lifetimeKarma.toLocaleString()}
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 400 }}> Karma</span>
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          flex: 1,
          padding: '10px',
          background: '#f9fafb',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
            {karma.trustScore || 0}
          </p>
          <p style={{ fontSize: '11px', color: '#6b7280' }}>Trust Score</p>
        </div>
        <div style={{
          flex: 1,
          padding: '10px',
          background: '#f9fafb',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#8b5cf6' }}>
            {karma.badges?.length || 0}
          </p>
          <p style={{ fontSize: '11px', color: '#6b7280' }}>Badges</p>
        </div>
      </div>

      {karma.badges && karma.badges.length > 0 && (
        <div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Badges:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {karma.badges.slice(0, 5).map((badge, i) => (
              <span key={i} style={{
                padding: '4px 10px',
                background: '#f3f4f6',
                borderRadius: '12px',
                fontSize: '12px',
              }}>
                {badge.icon || '🏅'} {badge.name}
              </span>
            ))}
            {karma.badges.length > 5 && (
              <span style={{
                padding: '4px 10px',
                background: '#e5e7eb',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#6b7280',
              }}>
                +{karma.badges.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
