'use client';

import React from 'react';
import Header from '@/components/layout/Header';

interface DashboardWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function DashboardWrapper({
  children,
  title,
  subtitle,
  actions,
}: DashboardWrapperProps) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <div className="flex-1 p-6">
        {actions && (
          <div className="flex justify-end gap-3 mb-6">{actions}</div>
        )}
        {children}
      </div>
    </>
  );
}
