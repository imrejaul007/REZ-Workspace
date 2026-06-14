'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const navItems = [
  {
    section: 'AI Hub',
    items: [
      { href: '/ai-hub', label: 'AI Intelligence', icon: '🤖' },
      { href: '/agent', label: 'AI Chat', icon: '💬' },
      { href: '/productivity', label: 'Productivity Index', icon: '📈' },
      { href: '/task-intelligence', label: 'Task AI', icon: '🔮' },
    ],
  },
  {
    section: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/analytics', label: 'Analytics', icon: '📊' },
      { href: '/demo', label: 'Demo', icon: '🎯' },
    ],
  },
  {
    section: 'Culture',
    items: [
      { href: '/recognition', label: 'Recognition', icon: '🏆' },
      { href: '/badges', label: 'Badges', icon: '🎖️' },
      { href: '/leaderboard', label: 'Leaderboard', icon: '📊' },
      { href: '/culture', label: 'Culture Pulse', icon: '😊' },
    ],
  },
  {
    section: 'Workforce Ops',
    items: [
      { href: '/field-workforce', label: 'Field Workers', icon: '📍' },
      { href: '/overtime', label: 'OT Intelligence', icon: '⏰' },
      ],
    },
    {
      section: 'Enterprise',
      items: [
        { href: '/assets', label: 'Assets', icon: '💻' },
        { href: '/visitor', label: 'Visitors', icon: '👤' },
        { href: '/contractors', label: 'Contractors', icon: '🏢' },
        { href: '/workflow', label: 'Automation', icon: '⚙️' },
        { href: '/lms', label: 'Training', icon: '🎓' },
        { href: '/compensation', label: 'Compensation', icon: '💰' },
        { href: '/franchise', label: 'Multi-Location', icon: '🌐' }
    ],
  },
  {
    section: 'Workforce',
    items: [
      { href: '/employees', label: 'Employees', icon: '👥' },
      { href: '/attendance', label: 'Attendance', icon: '⏰' },
      { href: '/leave', label: 'Leaves', icon: '🏖️' },
      { href: '/shifts', label: 'Shifts', icon: '📅' },
    ],
  },
  {
    section: 'Talent',
    items: [
      { href: '/hiring', label: 'Hiring', icon: '💼' },
      { href: '/screening', label: 'Screening', icon: '🔍' },
      { href: '/interviews', label: 'Interviews', icon: '🎥' },
      { href: '/onboarding', label: 'Onboarding', icon: '🎯' },
    ],
  },
  {
    section: 'Finance',
    items: [
      { href: '/payroll', label: 'Payroll', icon: '💰' },
      { href: '/payroll/automation', label: 'Auto Payroll', icon: '🤖' },
      { href: '/expenses', label: 'Expenses', icon: '📋' },
      { href: '/travel', label: 'Travel', icon: '🚗' },
    ],
  },
  {
    section: 'CRM',
    items: [
      { href: '/crm', label: 'CRM Dashboard', icon: '📊' },
      { href: '/crm/clients', label: 'Clients', icon: '👥' },
      { href: '/crm/deals', label: 'Deals', icon: '💼' },
      { href: '/crm/invoices', label: 'Invoices', icon: '📄' },
      { href: '/crm/reports', label: 'Reports', icon: '📈' },
    ],
  },
  {
    section: 'Performance',
    items: [
      { href: '/performance', label: 'Reviews', icon: '📊' },
      { href: '/okrs', label: 'OKRs', icon: '🎯' },
      { href: '/surveys', label: 'Surveys', icon: '📋' },
      { href: '/time', label: 'Time Tracking', icon: '⏰' },
    ],
  },
  {
    section: 'Employee',
    items: [
      { href: '/employee-app', label: 'Self-Service', icon: '📱' },
    ],
  },
  {
    section: 'Documents',
    items: [
      { href: '/documents', label: 'Documents', icon: '📄' },
      { href: '/org-chart', label: 'Org Chart', icon: '🏢' },
      { href: '/compliance', label: 'Compliance', icon: '✅' },
    ],
  },
  {
    section: 'Comms',
    items: [
      { href: '/announcements', label: 'Announcements', icon: '📢' },
      { href: '/whatsapp', label: 'WhatsApp', icon: '💬' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🧠</span>
        <span className={styles.logoText}>PeopleOS</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((section) => (
          <div key={section.section} className={styles.section}>
            <div className={styles.sectionHeader}>{section.section}</div>
            <ul className={styles.items}>
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.item} ${
                      pathname.startsWith(item.href) ? styles.active : ''
                    }`}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <Link href="/settings" className={styles.footerLink}>
          ⚙️ Settings
        </Link>
      </div>
    </aside>
  );
}
