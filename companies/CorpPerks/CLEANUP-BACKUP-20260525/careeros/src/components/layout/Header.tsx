'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      <div className={styles.right}>
        <button className={styles.iconBtn} title="Notifications">
          🔔
          <span className={styles.badge}>3</span>
        </button>

        <div className={styles.profile}>
          <button
            className={styles.profileBtn}
            onClick={() => setShowMenu(!showMenu)}
          >
            <div className={styles.avatar}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className={styles.name}>{user?.name || 'User'}</span>
            <span className={styles.arrow}>▼</span>
          </button>

          {showMenu && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
              <div className={styles.dropdownDivider}></div>
              <button className={styles.dropdownItem}>Profile</button>
              <button className={styles.dropdownItem}>Settings</button>
              <button className={styles.dropdownItem}>Help & Support</button>
              <div className={styles.dropdownDivider}></div>
              <button className={styles.dropdownItem} onClick={logout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
