'use client';

import { useState } from 'react';

const posts = [
  { id: 1, user: 'Rahul Singh', avatar: 'RS', content: 'Amazing teamwork on the product launch! Priya debugging skills saved us 3 days!', time: '2h ago', likes: 12, coins: 50 },
  { id: 2, user: 'Neha Patel', avatar: 'NP', content: 'Shoutout to Amit for covering my shift last minute. True team player!', time: '4h ago', likes: 8, coins: 25 },
  { id: 3, user: 'Vikram Kumar', avatar: 'VK', content: 'Shipped 3 features this week. Team is on fire!', time: '6h ago', likes: 15, coins: 75 },
  { id: 4, user: 'Priya Sharma', avatar: 'PS', content: 'Resolved critical bug in production. Great collaboration with DevOps team!', time: '1d ago', likes: 20, coins: 100 },
];

const quickKudos = [
  { icon: '🚀', label: 'Fast Response', coins: 10 },
  { icon: '💪', label: 'Team Player', coins: 15 },
  { icon: '🎯', label: 'Goal Crusher', coins: 20 },
  { icon: '🔥', label: 'Hot Streak', coins: 25 },
];

export default function RecognitionPage() {
  const [showKudos, setShowKudos] = useState(false);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Recognition</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Celebrate your team</p>
        </div>
        <button style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          + Give Kudos
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <span style={{ fontSize: 32 }}>🏆</span>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#ffd700', margin: '8px 0 0' }}>1,247</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Total Recognition</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <span style={{ fontSize: 32 }}>🙌</span>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6', margin: '8px 0 0' }}>89</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>This Week</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <span style={{ fontSize: 32 }}>🪙</span>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', margin: '8px 0 0' }}>12.5K</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Coins Given</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <span style={{ fontSize: 32 }}>🔥</span>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', margin: '8px 0 0' }}>15</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Streak Days</p>
        </div>
      </div>

      <div style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Quick Kudos</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickKudos.map(k => (
            <button key={k.label} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{k.icon}</span>
              <span style={{ fontSize: 13 }}>{k.label}</span>
              <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>+{k.coins}</span>
            </button>
          ))}
        </div>
      </div>

      <h2 style={{ marginBottom: 16 }}>Recognition Feed</h2>
      {posts.map(post => (
        <div key={post.id} style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>{post.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{post.user}</span>
                <span style={{ fontSize: 12, color: '#8b5cf6', background: '#f3f4f6', padding: '2px 8px', borderRadius: 10 }}>+{post.coins} 🪙</span>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{post.time}</p>
            </div>
          </div>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{post.content}</p>
          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
              ❤️ {post.likes}
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
              💬 Comment
            </button>
            <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', border: 'none', padding: '6px 12px', borderRadius: 20, cursor: 'pointer', color: '#b45309' }}>
              🙌 Appreciate +{post.coins} 🪙
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
