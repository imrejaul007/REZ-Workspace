'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const menuItems = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/resume', icon: '📄', label: 'Resume Builder' },
  { href: '/career-path', icon: '🗺️', label: 'Career Path' },
  { href: '/interview', icon: '🎯', label: 'Interview Coach' },
  { href: '/alerts', icon: '🔔', label: 'Job Alerts' },
  { href: '/negotiate', icon: '💰', label: 'Salary Negotiator' },
  { href: '/skill-gap', icon: '📊', label: 'Skill Gap Analyzer' },
  { href: '/marketplace', icon: '🌐', label: 'Service Marketplace' },
  { href: '/opportunities', icon: '🎓', label: 'Opportunities' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Link href="/dashboard">CareerOS</Link>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <Link href="/settings" className={styles.navItem}>
          <span className={styles.icon}>⚙️</span>
          <span className={styles.label}>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
