/**
 * TreasuryOS Dashboard - Main App with Routing
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { AccountsPage } from './pages/Accounts';
import { InvestmentsPage } from './pages/Investments';
import { ForecastPage } from './pages/Forecast';
import { AlertsPage } from './pages/Alerts';

function App() {
  const [businessId] = useState('biz_demo_123');

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/accounts', label: 'Accounts', icon: '💼' },
    { path: '/investments', label: 'Investments', icon: '📈' },
    { path: '/forecast', label: 'Forecast', icon: '🔮' },
    { path: '/alerts', label: 'Alerts', icon: '🔔' },
  ];

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">TreasuryOS</h1>
                <p className="text-xs text-gray-500">Cash Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <span className="text-gray-500">🔔</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">RK</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
            <div className="p-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="p-4 mt-8 border-t">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Balance</span>
                  <span className="font-medium">₹24.5L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Invested</span>
                  <span className="font-medium">₹8.5L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Alerts</span>
                  <span className="font-medium text-orange-600">2</span>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard businessId={businessId} />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/investments" element={<InvestmentsPage />} />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;