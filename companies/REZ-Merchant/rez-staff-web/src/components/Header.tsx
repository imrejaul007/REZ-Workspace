'use client';

import React from 'react';

interface HeaderProps {
  userRole?: string;
  userName?: string;
}

export default function Header({ userRole = 'Front Desk', userName = 'Staff Member' }: HeaderProps) {
  return (
    <header className="bg-blue-900 text-white p-4 shadow-lg">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Hotel Staff Dashboard</h1>
          <span className="text-sm opacity-75">Welcome, {userName}</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="bg-blue-800 px-3 py-1 rounded text-sm">{userRole}</span>
          <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition-colors">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
