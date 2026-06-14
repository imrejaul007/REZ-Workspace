'use client';

import { useState } from 'react';

export default function MyQRPage() {
  const employee = {
    id: 'EMP001',
    name: 'Priya Sharma',
    employeeId: 'PS-2024-001',
    department: 'Engineering',
    qrCode: 'EMP001-PRIYA-SHARMA',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: 24 }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Your QR Code</h1>
          <p style={{ color: '#6b7280' }}>Show this QR for attendance at any location</p>
        </div>

        {/* Employee Card */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'center' }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            color: 'white',
            fontWeight: 700,
          }}>
            PS
          </div>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>{employee.name}</h2>
          <p style={{ color: '#6b7280', marginBottom: 8 }}>{employee.department}</p>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>ID: {employee.employeeId}</p>
        </div>

        {/* QR Code */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, textAlign: 'center' }}>
          <div style={{
            width: 200,
            height: 200,
            background: '#f9fafb',
            margin: '0 auto 16px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #d1d5db',
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 64 }}>📱</span>
              <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 8 }}>QR Code</p>
              <p style={{ fontSize: 10, color: '#9ca3af' }}>{employee.qrCode}</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Scan this QR at workplace to mark attendance
          </p>
          <button style={{
            width: '100%',
            padding: 12,
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            📥 Download QR Code
          </button>
        </div>

        {/* Instructions */}
        <div style={{
          marginTop: 24,
          background: '#eff6ff',
          padding: 20,
          borderRadius: 12,
          borderLeft: '4px solid #3b82f6',
        }}>
          <h3 style={{ color: '#1d4ed8', marginBottom: 12, fontSize: 16 }}>How to use:</h3>
          <ol style={{ color: '#1e40af', fontSize: 13, paddingLeft: 16, lineHeight: 2, margin: 0 }}>
            <li>Go to workplace or your WFH location</li>
            <li>Open /scan page or scan this QR</li>
            <li>System checks your GPS against assigned location</li>
            <li>If within radius → attendance marked!</li>
          </ol>
        </div>

        {/* WFH Info */}
        <div style={{
          marginTop: 16,
          background: '#f0fdf4',
          padding: 20,
          borderRadius: 12,
          borderLeft: '4px solid #10b981',
        }}>
          <h3 style={{ color: '#15803d', marginBottom: 8, fontSize: 16 }}>🏠 Working from Home?</h3>
          <p style={{ color: '#166534', fontSize: 13, marginBottom: 12 }}>
            Request WFH location so HR knows where you're working from.
          </p>
          <a href="/wfh-request" style={{
            display: 'block',
            textAlign: 'center',
            padding: 12,
            background: '#10b981',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 500,
          }}>
            Request WFH Location
          </a>
        </div>
      </div>
    </div>
  );
}
