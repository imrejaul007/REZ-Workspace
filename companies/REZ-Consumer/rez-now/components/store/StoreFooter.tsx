'use client';

import { useState } from 'react';
import StoreImage from '@/components/ui/StoreImage';
import { StoreInfo } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

// ── helpers ──────────────────────────────────────────────────────────────────

const DAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

type DayKey = (typeof DAYS)[number];

/** "9:00" → "9am", "13:30" → "1:30pm", "09:00" → "9am" */
function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? '0', 10);
  const suffix = h >= 12 ? 'pm' : 'am';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, '0')}${suffix}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── sub-components ───────────────────────────────────────────────────────────

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3.284 14.253A8.959 8.959 0 013 12c0-1.17.22-2.287.614-3.318" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={cn('w-4 h-4 transition-transform duration-200', open && 'rotate-180')}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── main component ────────────────────────────────────────────────────────────

interface StoreFooterProps {
  store: StoreInfo;
}

export default function StoreFooter({ store }: StoreFooterProps) {
  const [hoursExpanded, setHoursExpanded] = useState(false);

  const todayKey = DAYS[new Date().getDay()] as DayKey;
  const todayHours = store.operatingHours?.[todayKey] ?? null;

  const hasSocialLinks =
    store.socialLinks?.instagram ||
    store.socialLinks?.facebook ||
    store.socialLinks?.twitter ||
    store.socialLinks?.website;

  return (
    <footer className="mt-6 bg-white border-t border-gray-100">
      {/* ── Store info ── */}
      <div className="px-4 py-5 flex items-start gap-3 border-b border-gray-50">
        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
          <StoreImage
            src={store.logo}
            alt={store.name}
            width={56}
            height={56}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-gray-900 truncate">{store.name}</p>
          {store.address && (
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{store.address}</p>
          )}
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium mt-1 hover:underline"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" />
              </svg>
              {store.phone}
            </a>
          )}
        </div>
      </div>

      {/* ── Operating hours ── */}
      {store.operatingHours && Object.keys(store.operatingHours).length > 0 && (
        <div className="px-4 py-4 border-b border-gray-50">
          {/* Today's hours summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Hours</p>
              {todayHours ? (
                <p className="text-sm font-medium text-gray-900">
                  Open today{' '}
                  <span className="text-green-600">
                    {formatTime(todayHours.open)} – {formatTime(todayHours.close)}
                  </span>
                </p>
              ) : (
                <p className="text-sm font-medium text-red-600">Closed today</p>
              )}
            </div>
            <button
              onClick={() => setHoursExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0"
              aria-expanded={hoursExpanded}
              aria-label="Toggle full week schedule"
            >
              Full week
              <ChevronDownIcon open={hoursExpanded} />
            </button>
          </div>

          {/* Collapsible full week schedule */}
          {hoursExpanded && (
            <div className="mt-3 space-y-1">
              {DAYS.map((day) => {
                const hours = store.operatingHours?.[day] ?? null;
                const isToday = day === todayKey;
                return (
                  <div
                    key={day}
                    className={cn(
                      'flex justify-between text-xs py-0.5',
                      isToday ? 'font-semibold text-gray-900' : 'text-gray-500'
                    )}
                  >
                    <span>{capitalize(day)}{isToday && ' (today)'}</span>
                    {hours ? (
                      <span>{formatTime(hours.open)} – {formatTime(hours.close)}</span>
                    ) : (
                      <span className="text-red-500">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Social links ── */}
      {hasSocialLinks && (
        <div className="px-4 py-4 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Find us</p>
          <div className="flex items-center gap-3">
            {store.socialLinks?.instagram && (
              <a
                href={store.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-600 transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
            )}
            {store.socialLinks?.facebook && (
              <a
                href={store.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
            )}
            {store.socialLinks?.twitter && (
              <a
                href={store.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-900 transition-colors"
                aria-label="X / Twitter"
              >
                <TwitterIcon />
              </a>
            )}
            {store.socialLinks?.website && (
              <a
                href={store.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-indigo-600 transition-colors"
                aria-label="Website"
              >
                <GlobeIcon />
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Compliance ── */}
      {(store.fssaiNumber || store.gstNumber) && (
        <div className="px-4 py-3 border-b border-gray-50 space-y-0.5">
          {store.fssaiNumber && (
            <p className="text-[10px] text-gray-400">FSSAI License No: {store.fssaiNumber}</p>
          )}
          {store.gstNumber && (
            <p className="text-[10px] text-gray-400">GSTIN: {store.gstNumber}</p>
          )}
        </div>
      )}

      {/* ── Powered by REZ + Merchant CTA ── */}
      <div className="px-4 py-4 flex flex-col items-center gap-3">
        <a
          href="https://rez.money"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Powered by REZ"
        >
          <span className="text-[11px]">Order &amp; pay with</span>
          <span className="text-[13px] font-bold tracking-tight text-gray-500">REZ</span>
        </a>
        <a
          href="https://merchant.rez.money"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-gray-400 hover:text-indigo-600 transition-colors hover:underline"
        >
          Own a business? Join REZ
        </a>
      </div>
    </footer>
  );
}
