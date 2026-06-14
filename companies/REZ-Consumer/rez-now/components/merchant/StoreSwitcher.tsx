'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

export interface OutletOption {
  slug: string;
  name: string;
  outletCode: string;
  city?: string;
  isPrimaryOutlet: boolean;
}

interface StoreSwitcherProps {
  currentSlug: string;
  outlets: OutletOption[];
  onSwitch: (slug: string) => void;
}

const STORAGE_KEY = 'rez-merchant-outlet';

export function getStoredOutlet(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredOutlet(slug: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, slug);
}

export default function StoreSwitcher({ currentSlug, outlets, onSwitch }: StoreSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>(currentSlug);

  // Sync with prop when it changes
  useEffect(() => {
    setSelected(currentSlug);
  }, [currentSlug]);

  if (outlets.length <= 1) return null;

  const selectedOutlet = outlets.find((o) => o.slug === selected) ?? outlets[0];

  function handleSelect(slug: string) {
    setSelected(slug);
    setStoredOutlet(slug);
    onSwitch(slug);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
          'bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* Store icon */}
        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="max-w-[140px] truncate">
          {selectedOutlet?.name ?? 'Select outlet'}
        </span>
        {selectedOutlet?.city && (
          <span className="text-xs text-gray-500 hidden sm:inline">({selectedOutlet.city})</span>
        )}
        {/* Dropdown arrow */}
        <svg
          className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown panel */}
          <ul
            className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1"
            role="listbox"
          >
            {/* All outlets — aggregate view */}
            <li
              onClick={() => handleSelect('')}
              className={cn(
                'px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 transition-colors',
                selected === '' && 'bg-indigo-50 text-indigo-700 font-semibold',
              )}
              role="option"
              aria-selected={selected === ''}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="font-medium">All outlets</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 ml-6">View aggregate across all stores</p>
            </li>

            <li className="my-1 border-t border-gray-100" />

            {outlets.map((outlet) => (
              <li
                key={outlet.slug}
                onClick={() => handleSelect(outlet.slug)}
                className={cn(
                  'px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 transition-colors',
                  selected === outlet.slug && 'bg-indigo-50 text-indigo-700 font-semibold',
                )}
                role="option"
                aria-selected={selected === outlet.slug}
              >
                <div className="flex items-center gap-2">
                  {outlet.isPrimaryOutlet && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                      HQ
                    </span>
                  )}
                  <span>{outlet.name}</span>
                </div>
                {(outlet.outletCode || outlet.city) && (
                  <p className="text-xs text-gray-500 mt-0.5 ml-0">
                    {outlet.outletCode && <span className="text-gray-400">#{outlet.outletCode}</span>}
                    {outlet.city && <span className={outlet.outletCode ? 'ml-1' : ''}>{outlet.city}</span>}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
