'use client';

import { useState } from 'react';

const certs = [
  { id: '1', title: 'AWS Cloud Practitioner', issuer: 'Amazon', date: 'May 2026', status: 'earned', icon: '☁️' },
  { id: '2', title: 'Google Analytics', issuer: 'Google', date: 'Apr 2026', status: 'earned', icon: '📊' },
  { id: '3', title: 'Meta Marketing', issuer: 'Meta', date: 'Jun 2026', status: 'in_progress', icon: '📱' },
  { id: '4', title: 'HubSpot Inbound', issuer: 'HubSpot', date: 'Jul 2026', status: 'not_started', icon: '📢' },
];

export default function CertificationsPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>🏅 Certifications</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Track and showcase your achievements</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#10b981', margin: 0 }}>2</p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Earned</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', margin: 0 }}>1</p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>In Progress</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>5</p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Recommended</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#06b6d4', margin: 0 }}>0</p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Expired</p>
        </div>
      </div>

      <h2 style={{ marginBottom: 16 }}>My Certifications</h2>
      {certs.map(cert => (
        <div key={cert.id} style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, background: cert.status === 'earned' ? '#dcfce7' : '#f3f4f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {cert.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>{cert.title}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{cert.issuer} • {cert.date}</p>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: cert.status === 'earned' ? '#dcfce7' : cert.status === 'in_progress' ? '#fef3c7' : '#f3f4f6',
            color: cert.status === 'earned' ? '#15803d' : cert.status === 'in_progress' ? '#b45309' : '#6b7280',
          }}>
            {cert.status === 'earned' ? '✅ Earned' : cert.status === 'in_progress' ? '⏳ In Progress' : '📋 Not Started'}
          </span>
          {cert.status !== 'earned' && (
            <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              {cert.status === 'in_progress' ? 'Continue' : 'Start'}
            </button>
          )}
        </div>
      ))}

      <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', padding: 24, borderRadius: 16, marginTop: 24, color: 'white' }}>
        <h3 style={{ margin: '0 0 8px' }}>🎯 Recommended for You</h3>
        <p style={{ opacity: 0.9, marginBottom: 16 }}>Based on your career goals, we recommend:</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: 13 }}>Google Data Analytics</span>
          <span style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: 13 }}>Salesforce Admin</span>
          <span style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: 13 }}>Python for Everybody</span>
        </div>
      </div>
    </div>
  );
}
