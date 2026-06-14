'use client';

import React from 'react';

interface StatsCardProps {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}

export default function StatsCard({ label, value, color, icon }: StatsCardProps) {
  return (
    <div className={`${color} text-white rounded-lg p-4 shadow-md transition-transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-sm opacity-90">{label}</div>
        </div>
        {icon && <div className="text-3xl opacity-80">{icon}</div>}
      </div>
    </div>
  );
}
