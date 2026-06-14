'use client';

import { useState } from 'react';
import { StoreInfo } from '@/lib/types';
import StoreImage from '@/components/ui/StoreImage';
import { cn } from '@/lib/utils/cn';
import { useTrack } from '@/lib/analytics/events';

// ── Types ──────────────────────────────────────────────────────────────────────

interface StoreProfileProps {
  store: StoreInfo;
  accentColor?: string;
  showCoverImage?: boolean;
  showQuickActions?: boolean;
  className?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
type DayKey = (typeof DAYS)[number];

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

// ── Icons ────────────────────────────────────────────────────────────────────────

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-5 h-5', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn('w-5 h-5', className)} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-5 h-5', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-5 h-5', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-5 h-5', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronDownIcon({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={cn('w-4 h-4 transition-transform duration-200', open && 'rotate-180', className)}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-5 h-5', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cn('w-5 h-5', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StoreProfile({
  store,
  accentColor = '#4F46E5',
  showCoverImage = true,
  showQuickActions = true,
  className,
}: StoreProfileProps) {
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const track = useTrack();

  const todayKey = DAYS[new Date().getDay()] as DayKey;
  const todayHours = store.operatingHours?.[todayKey] ?? null;

  const handleActionClick = (action: string) => {
    track({
      event: 'profile_action_clicked',
      storeSlug: store.slug,
      properties: { action },
    });
  };

  const whatsappNumber = store.phone?.replace(/\D/g, '');

  return (
    <div className={cn('bg-white', className)}>
      {/* Cover Image */}
      {showCoverImage && store.banner && (
        <div className="relative h-32 sm:h-40 overflow-hidden">
          <StoreImage
            src={store.banner}
            alt={`${store.name} cover`}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Profile Header */}
      <div className={cn('px-4', showCoverImage ? '-mt-12 relative z-10' : 'pt-4')}>
        <div className="flex items-end gap-4">
          {/* Logo */}
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white flex-shrink-0">
            <StoreImage
              src={store.logo}
              alt={store.name}
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* Store Info */}
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-xl font-bold text-gray-900 truncate">{store.name}</h1>
            {store.address && (
              <p className="text-sm text-gray-500 mt-0.5 truncate flex items-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                {store.address}
              </p>
            )}
          </div>
        </div>

        {/* Store Status */}
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              store.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', store.isOpen ? 'bg-green-500' : 'bg-red-500')} />
            {store.isOpen ? 'Open' : 'Closed'}
          </span>
          {store.nextChangeLabel && (
            <span className="text-xs text-gray-500">{store.nextChangeLabel}</span>
          )}
        </div>
      </div>

      {/* Operating Hours Widget */}
      {store.operatingHours && Object.keys(store.operatingHours).length > 0 && (
        <div className="px-4 mt-4 py-3 border-t border-gray-100">
          <button
            onClick={() => setHoursExpanded(!hoursExpanded)}
            className="flex items-center justify-between w-full text-left"
            aria-expanded={hoursExpanded}
          >
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Hours</span>
            </div>
            <div className="flex items-center gap-2">
              {todayHours ? (
                <span className="text-sm text-green-600">
                  {formatTime(todayHours.open)} – {formatTime(todayHours.close)}
                </span>
              ) : (
                <span className="text-sm text-red-600">Closed today</span>
              )}
              <ChevronDownIcon open={hoursExpanded} />
            </div>
          </button>

          {hoursExpanded && (
            <div className="mt-3 pl-6 space-y-1">
              {DAYS.map((day) => {
                const hours = store.operatingHours?.[day] ?? null;
                const isToday = day === todayKey;
                return (
                  <div
                    key={day}
                    className={cn(
                      'flex justify-between text-sm py-0.5',
                      isToday ? 'font-semibold text-gray-900' : 'text-gray-500'
                    )}
                  >
                    <span>{capitalize(day)}{isToday && ' (today)'}</span>
                    {hours ? (
                      <span>{formatTime(hours.open)} – {formatTime(hours.close)}</span>
                    ) : (
                      <span className="text-red-400">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contact Buttons */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              onClick={() => handleActionClick('call')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
            >
              <PhoneIcon className="w-4 h-4" />
              <span>Call</span>
            </a>
          )}

          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleActionClick('whatsapp')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          )}

          {store.email && (
            <a
              href={`mailto:${store.email}`}
              onClick={() => handleActionClick('email')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
            >
              <MailIcon className="w-4 h-4" />
              <span>Email</span>
            </a>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      {showQuickActions && (
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex gap-2">
            {store.hasMenu && (
              <a
                href={`/${store.slug}`}
                onClick={() => handleActionClick('view_menu')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                <MenuIcon className="w-4 h-4" />
                <span>View Menu</span>
              </a>
            )}

            {store.reservationsEnabled && (
              <a
                href={`/${store.slug}/reserve`}
                onClick={() => handleActionClick('reserve')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Reserve</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
