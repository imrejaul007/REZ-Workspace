import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { StaffList } from './pages/StaffList';
import { Schedule } from './pages/Schedule';
import { Attendance } from './pages/Attendance';
import { PerformancePage } from './pages/Performance';
import { ShiftSwapPage } from './pages/ShiftSwap';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  ArrowLeftRight,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/staff', label: 'Staff', icon: Users },
  { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { path: '/performance', label: 'Performance', icon: TrendingUp },
  { path: '/swaps', label: 'Shift Swaps', icon: ArrowLeftRight },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ReZ</span>
            </div>
            <span className="font-bold text-gray-900">Staff Hub</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive && 'text-primary-600')} />
              {!collapsed && (
                <span className={clsx('font-medium', isActive && 'text-primary-700')}>
                  {label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Logged in as</p>
            <p className="font-medium text-gray-900">Admin User</p>
          </div>
        </div>
      )}
    </aside>
  );
}

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main
        className={clsx(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/staff" element={<StaffList />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/swaps" element={<ShiftSwapPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
