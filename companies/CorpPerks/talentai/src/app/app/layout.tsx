'use client';

import { NextPage } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AppLayout: NextPage = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const navItems = [
    { href: '/app', icon: '📊', label: 'Dashboard' },
    { href: '/app/recruiter', icon: '👥', label: 'Recruiter' },
    { href: '/app/marketing', icon: '📢', label: 'Marketing' },
    { href: '/app/finance', icon: '💰', label: 'Finance' },
    { href: '/app/employees', icon: '👔', label: 'Employees' },
    { href: '/app/jobs', icon: '💼', label: 'Jobs' },
    { href: '/app/candidates', icon: '🎯', label: 'Candidates' },
    { href: '/app/marketplace', icon: '🛒', label: 'Marketplace' },
    { href: '/app/training', icon: '🎓', label: 'Training' },
    { href: '/app/onboarding', icon: '🚀', label: 'Onboarding' },
    { href: '/app/payroll', icon: '💳', label: 'Payroll' },
    { href: '/app/calendar', icon: '📅', label: 'Calendar' },
    { href: '/app/interview', icon: '📝', label: 'Interview' },
    { href: '/app/analytics', icon: '📈', label: 'Analytics' },
    { href: '/app/helpdesk', icon: '🎧', label: 'Helpdesk' },
    { href: '/app/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center">
            <span className="text-2xl mr-2">🏢</span>
            <span className="font-bold text-lg">TalentOS</span>
          </Link>
        </div>
        <nav className="p-2">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg mb-1 ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-semibold">Welcome back, Admin</h1>
            <p className="text-sm text-gray-500">May 29, 2026</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">🔔</button>
            <button className="p-2 hover:bg-gray-100 rounded-full">⚙️</button>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">A</div>
          </div>
        </header>

        {/* Page Content */}
        <div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
