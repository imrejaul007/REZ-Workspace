'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { useTrack } from '@/lib/analytics/events';

// ── Types ──────────────────────────────────────────────────────────────────────

export type LinkType = 'website' | 'menu' | 'reservation' | 'order' | 'contact' | 'social' | 'custom';

export interface StoreLink {
  id: string;
  type: LinkType;
  label: string;
  url: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

interface StoreLinksProps {
  links: StoreLink[];
  storeSlug: string;
  accentColor?: string;
  className?: string;
}

// ── Icon components ────────────────────────────────────────────────────────────

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function ShoppingBagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

// ── Icon mapping ───────────────────────────────────────────────────────────────

function getLinkIcon(type: LinkType) {
  switch (type) {
    case 'website':
      return <GlobeIcon />;
    case 'menu':
      return <MenuIcon />;
    case 'reservation':
      return <CalendarIcon />;
    case 'order':
      return <ShoppingBagIcon />;
    case 'contact':
      return <PhoneIcon />;
    case 'social':
    case 'custom':
    default:
      return <LinkIcon />;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StoreLinks({ links, storeSlug, accentColor = '#4F46E5', className }: StoreLinksProps) {
  const track = useTrack();

  const handleLinkClick = useCallback((link: StoreLink) => {
    track({
      event: 'link_clicked',
      storeSlug,
      properties: {
        linkId: link.id,
        linkType: link.type,
        linkLabel: link.label,
      },
    });
  }, [storeSlug, track]);

  const sortedLinks = [...links]
    .filter((link) => link.isActive)
    .sort((a, b) => a.order - b.order)
    .slice(0, 10); // Max 10 links

  if (sortedLinks.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {sortedLinks.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target={link.url.startsWith('http') ? '_blank' : undefined}
          rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
          onClick={() => handleLinkClick(link)}
          className="group flex items-center justify-between w-full px-4 py-3.5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ '--accent-color': accentColor, '--tw-ring-color': accentColor } as React.CSSProperties}
          aria-label={`${link.label}${link.url.startsWith('http') ? ' (opens in new tab)' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 text-gray-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"
              style={accentColor ? {
                backgroundColor: 'transparent',
                color: undefined,
              } : undefined}
            >
              {getLinkIcon(link.type)}
            </div>
            <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
              {link.label}
            </span>
          </div>
          {link.url.startsWith('http') && (
            <ExternalIcon />
          )}
        </a>
      ))}
    </div>
  );
}

// ── Preset link generators ────────────────────────────────────────────────────

export function createPresetLinks(storeSlug: string, hasMenu: boolean, reservationsEnabled: boolean): StoreLink[] {
  const baseUrl = `https://rez.money/${storeSlug}`;

  const links: StoreLink[] = [];

  if (hasMenu) {
    links.push({
      id: 'menu',
      type: 'menu',
      label: 'View Menu',
      url: `/${storeSlug}`,
      order: 1,
      isActive: true,
    });
  }

  if (reservationsEnabled) {
    links.push({
      id: 'reservation',
      type: 'reservation',
      label: 'Book a Table',
      url: `/${storeSlug}/reserve`,
      order: 2,
      isActive: true,
    });
  }

  links.push({
    id: 'order',
    type: 'order',
    label: 'Order Online',
    url: `/${storeSlug}/order`,
    order: 3,
    isActive: true,
  });

  return links;
}
