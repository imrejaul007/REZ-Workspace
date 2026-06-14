'use client';

import { useState } from 'react';

const projects = [
  { id: '1', title: 'E-commerce App', description: 'Built with React Native + Node.js', tags: ['React', 'Node', 'MongoDB'], views: 245, likes: 32 },
  { id: '2', title: 'AI Chatbot', description: 'NLP-powered customer service bot', tags: ['Python', 'TensorFlow', 'Flask'], views: 189, likes: 28 },
  { id: '3', title: 'Portfolio Website', description: 'Personal portfolio with animations', tags: ['React', 'Framer Motion'], views: 156, likes: 45 },
];

export default function PortfolioPage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>💼 Portfolio</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Showcase your work to recruiters</p>
        </div>
        <button style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          + Add Project
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>3</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Projects</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#10b981', margin: 0 }}>590</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Views</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', margin: 0 }}>105</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Likes</p>
        </div>
      </div>

      <h2 style={{ marginBottom: 16 }}>My Projects</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {projects.map(project => (
          <div key={project.id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ height: 150, background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 48 }}>🚀</span>
            </div>
            <div style={{ padding: 16 }}>
              <h3 style={{ margin: 0 }}>{project.title}</h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0' }}>{project.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {project.tags.map(tag => (
                  <span key={tag} style={{ padding: '2px 8px', background: '#f3f4f6', borderRadius: 10, fontSize: 11 }}>{tag}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
                <span>👁 {project.views}</span>
                <span>♥ {project.likes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#f0fdf4', padding: 24, borderRadius: 12, marginTop: 24, borderLeft: '4px solid #10b981' }}>
        <h3 style={{ color: '#15803d', marginBottom: 8 }}>💡 Pro Tip</h3>
        <p style={{ color: '#166534', margin: 0 }}>Add your GitHub projects to automatically showcase your coding skills to recruiters.</p>
      </div>
    </div>
  );
}
