'use client';

import { useState } from 'react';

const categories = [
  { id: 'all', name: 'All', icon: '🛒' },
  { id: 'wellness', name: 'Wellness', icon: '💪' },
  { id: 'learning', name: 'Learning', icon: '📚' },
  { id: 'food', name: 'Food', icon: '🍽️' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'subscription', name: 'Subscriptions', icon: '📱' },
  { id: 'insurance', name: 'Insurance', icon: '🏥' },
  { id: 'fitness', name: 'Fitness', icon: '🏋️' },
];

const benefits = [
  { id: '1', name: 'FitIndia Gym', icon: '🏋️', category: 'wellness', price: 1500, rating: 4.5, users: '2.5K+' },
  { id: '2', name: 'Coursera', icon: '📚', category: 'learning', price: 3999, rating: 4.8, users: '10K+' },
  { id: '3', name: 'Spotify Premium', icon: '🎵', category: 'subscription', price: 199, rating: 4.6, users: '50K+' },
  { id: '4', name: 'Swiggy One', icon: '🍕', category: 'food', price: 599, rating: 4.3, users: '100K+' },
  { id: '5', name: 'Netflix', icon: '🎬', category: 'subscription', price: 649, rating: 4.7, users: '200K+' },
  { id: '6', name: 'Cult.fit Yoga', icon: '🧘', category: 'wellness', price: 2500, rating: 4.4, users: '5K+' },
  { id: '7', name: 'Udemy Courses', icon: '💻', category: 'learning', price: 1299, rating: 4.5, users: '20K+' },
  { id: '8', name: 'Practo Health', icon: '🏥', category: 'insurance', price: 999, rating: 4.2, users: '1K+' },
  { id: '9', name: 'MakeMyTrip', icon: '✈️', category: 'travel', price: 5000, rating: 4.1, users: '50K+' },
  { id: '10', name: 'ChatGPT Plus', icon: '🤖', category: 'subscription', price: 1999, rating: 4.9, users: '15K+' },
  { id: '11', name: 'GitHub Copilot', icon: '💻', category: 'subscription', price: 1999, rating: 4.8, users: '8K+' },
  { id: '12', name: 'Zomato Gold', icon: '🍔', category: 'food', price: 499, rating: 4.0, users: '100K+' },
];

export default function BenefitsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = benefits.filter(b =>
    (activeCategory === 'all' || b.category === activeCategory) &&
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>🛒 Benefits Marketplace</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0' }}>Browse and use your benefit wallets</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search benefits..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: 14,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 14,
          }}
        />
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              background: activeCategory === cat.id ? '#10b981' : '#e5e7eb',
              color: activeCategory === cat.id ? 'white' : '#6b7280',
            }}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Partners', value: '150+', icon: '🏢' },
          { label: 'Categories', value: categories.length - 1, icon: '📂' },
          { label: 'Active Users', value: '25K+', icon: '👥' },
          { label: 'Savings', value: '₹50L+', icon: '💰' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', padding: 16, borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 24 }}>{stat.icon}</span>
            <p style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 0', color: '#10b981' }}>{stat.value}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Benefits Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {filtered.map(benefit => (
          <div
            key={benefit.id}
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 48 }}>{benefit.icon}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 16, textAlign: 'center' }}>{benefit.name}</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8, fontSize: 12, color: '#6b7280' }}>
              <span>⭐ {benefit.rating}</span>
              <span>•</span>
              <span>{benefit.users} users</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', color: '#10b981', margin: '12px 0' }}>
              ₹{benefit.price}/mo
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                flex: 1,
                padding: 10,
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
              }}>
                Use Wallet
              </button>
              <button style={{
                padding: 10,
                background: '#e5e7eb',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}>
                ♥
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12 }}>
          <span style={{ fontSize: 48 }}>🔍</span>
          <p style={{ color: '#6b7280', marginTop: 16 }}>No benefits found in this category</p>
        </div>
      )}

      {/* Popular Searches */}
      <div style={{ marginTop: 32, background: 'white', padding: 24, borderRadius: 12 }}>
        <h3 style={{ marginBottom: 16 }}>Popular Searches</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Gym membership', 'Online courses', 'Food delivery', 'Streaming', 'Productivity tools', 'Mental health'].map(tag => (
            <button
              key={tag}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: 20,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
