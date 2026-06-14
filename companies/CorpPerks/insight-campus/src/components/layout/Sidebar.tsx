'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const navItems = [
  {
    section: 'Student',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/courses', label: 'Courses', icon: '📚' },
      { href: '/career', label: 'Career', icon: '💼' },
    ],
  },
  {
    section: 'Learn',
    items: [
      { href: '/ask-questions', label: 'Ask Questions', icon: '❓' },
      { href: '/study-groups', label: 'Study Groups', icon: '👥' },
      { href: '/portfolio', label: 'Portfolio', icon: '💼' },
      { href: '/certifications', label: 'Certifications', icon: '🏅' },
    ],
  },
  {
    section: 'Resources',
    items: [
      { href: '/notes-marketplace', label: 'Notes Marketplace', icon: '📚' },
      { href: '/private-campus', label: 'Private Campus', icon: '🏛️' },
    ],
  },
  {
    section: 'Opportunities',
    items: [
      { href: '/opportunities', label: 'Opportunities', icon: '🌟' },
      { href: '/jobs', label: 'Jobs', icon: '💼' },
      { href: '/events', label: 'Events', icon: '📅' },
      { href: '/scholarships', label: 'Scholarships', icon: '🎓' },
      { href: '/mentors', label: 'Mentors', icon: '🎓' },
    ],
  },
  {
    section: 'Admin',
    items: [
      { href: '/admin', label: 'Admin Panel', icon: '⚙️' },
      { href: '/admin/students', label: 'Students', icon: '👨‍🎓' },
      { href: '/admin/courses', label: 'Courses', icon: '📚' },
      { href: '/admin/mentors', label: 'Mentors', icon: '🎓' },
      { href: '/admin/analytics', label: 'Analytics', icon: '📊' },
    ],
  },
  {
    section: 'Discover',
    items: [
      { href: '/ai-insights', label: 'AI Insights', icon: '🤖' },
    ],
  },
  {
    section: 'Account',
    items: [
      { href: '/profile', label: 'Profile', icon: '👤' },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(['Student']);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🎓</span>
        <span className={styles.logoText}>Insight Campus</span>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <nav className={styles.nav}>
        {navItems.map((section) => (
          <div key={section.section} className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection(section.section)}
            >
              <span>{section.section}</span>
              <span className={styles.chevron}>
                {expandedSections.includes(section.section) ? '▼' : '▶'}
              </span>
            </button>

            {expandedSections.includes(section.section) && (
              <ul className={styles.items}>
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`${styles.item} ${
                        pathname === item.href ? styles.active : ''
                      }`}
                    >
                      <span className={styles.icon}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <Link href="/settings" onClick={handleLinkClick} className={styles.footerLink}>
          ⚙️ Settings
        </Link>
      </div>
    </aside>
  );
}
