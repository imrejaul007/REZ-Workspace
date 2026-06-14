'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/lib/store/uiStore';
import { cn } from '@/lib/utils/cn';

export default function Toast() {
  const { toastMessage, toastType, clearToast } = useUIStore();

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(clearToast, 4000);
    return () => clearTimeout(t);
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-gray-800',
  };

  return (
    <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg pointer-events-auto max-w-sm',
          colors[toastType]
        )}
      >
        <span>{toastMessage}</span>
        <button onClick={clearToast} className="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}
