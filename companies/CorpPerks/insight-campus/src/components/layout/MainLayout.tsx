'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import styles from './MainLayout.module.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={styles.main}>
        <header className={styles.mobileHeader}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span>☰</span>
          </button>
          <span className={styles.mobileLogo}>🎓 Insight Campus</span>
          <div className={styles.mobileActions}>
            <button aria-label="Notifications">🔔</button>
            <div className={styles.mobileAvatar}>RS</div>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
