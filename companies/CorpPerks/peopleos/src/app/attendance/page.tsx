'use client';

import { useState } from 'react';
import styles from './page.module.css';

const mockEmployees = [
  { id: '1', name: 'Priya Sharma', phone: '98765 43210', status: 'present' },
  { id: '2', name: 'Rahul Verma', phone: '98765 43211', status: 'present' },
  { id: '3', name: 'Sneha Patel', phone: '98765 43212', status: 'absent' },
  { id: '4', name: 'Amit Kumar', phone: '98765 43213', status: 'late' },
];

export default function AttendancePage() {
  const [view, setView] = useState<'list' | 'qr' | 'gps'>('list');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Attendance</h1>
          <p className={styles.date}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>42</span>
            <span className={styles.statLabel}>Present</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>3</span>
            <span className={styles.statLabel}>Absent</span>
          </div>
        </div>
      </header>

      <div className={styles.views}>
        <button
          className={`${styles.viewBtn} ${view === 'list' ? styles.active : ''}`}
          onClick={() => setView('list')}
        >
          📋 List
        </button>
        <button
          className={`${styles.viewBtn} ${view === 'qr' ? styles.active : ''}`}
          onClick={() => setView('qr')}
        >
          📱 QR Scan
        </button>
        <button
          className={`${styles.viewBtn} ${view === 'gps' ? styles.active : ''}`}
          onClick={() => setView('gps')}
        >
          📍 GPS
        </button>
      </div>

      {view === 'list' && (
        <div className={styles.list}>
          <div className={styles.today}>
            <h2>Today's Attendance</h2>
            <div className={styles.employees}>
              {mockEmployees.map((emp) => (
                <div key={emp.id} className={styles.employee}>
                  <div className={styles.avatar}>
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={styles.info}>
                    <span className={styles.name}>{emp.name}</span>
                    <span className={styles.phone}>{emp.phone}</span>
                  </div>
                  <span className={`${styles.badge} ${styles[emp.status]}`}>
                    {emp.status === 'present' ? '✓' : emp.status === 'late' ? '⏰' : '✗'}
                    {emp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'qr' && (
        <div className={styles.qr}>
          <div className={styles.qrBox}>
            <span style={{fontSize: '80px'}}>📱</span>
            <h2>Scan Employee QR Code</h2>
            <p>Open camera to scan employee's attendance QR</p>
            <button className={styles.scanBtn}>Start Scanning</button>
          </div>
        </div>
      )}

      {view === 'gps' && (
        <div className={styles.gps}>
          <div className={styles.gpsBox}>
            <span style={{fontSize: '80px'}}>📍</span>
            <h2>GPS Check-in</h2>
            <p>Auto-detect location for remote attendance</p>
            <button className={styles.gpsBtn}>📍 Check In Now</button>
          </div>
        </div>
      )}
    </div>
  );
}
