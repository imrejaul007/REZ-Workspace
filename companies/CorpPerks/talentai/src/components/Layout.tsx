'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/jobs', label: 'Jobs', icon: '💼' },
    { href: '/companies', label: 'Companies', icon: '🏢' },
    { href: '/resume', label: 'Resume Builder', icon: '📝' },
    { href: '/career-path', label: 'Career Path', icon: '🛤️' },
    { href: '/interview', label: 'Interview Prep', icon: '🎯' },
    { href: '/marketplace', label: 'Marketplace', icon: '🌐' },
    { href: '/insights', label: 'Insights', icon: '📊' },
    { href: '/agent', label: 'AI Agent', icon: '🤖' },
    { href: '/salary-benchmark', label: 'Salary', icon: '💰' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '28px' }}>🎯</span>
            <span style={{ fontSize: '20px', fontWeight: 700, background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TalentAI</span>
          </Link>

          <nav style={{ display: 'flex', gap: '4px' }}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: pathname === item.href ? '#8b5cf6' : '#6b7280',
                  background: pathname === item.href ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/auth/login" style={{ padding: '8px 16px', color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
              Login
            </Link>
            <Link href="/signup" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>
    </div>
  );
}
