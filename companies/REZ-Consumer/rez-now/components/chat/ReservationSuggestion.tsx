'use client';

import { useState, useCallback } from 'react';
import { useUIStore } from '@/lib/store/uiStore';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';
import { createReservation } from '@/lib/api/reservations';

interface ReservationParams {
  date: string;
  time: string;
  guests: number;
  name?: string;
  phone?: string;
}

interface ReservationSuggestionProps {
  params: ReservationParams;
  storeSlug: string;
  onDismiss?: () => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h ?? 0, m ?? 0);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timeStr;
  }
}

export default function ReservationSuggestion({
  params,
  storeSlug,
  onDismiss,
}: ReservationSuggestionProps) {
  const showToast = useUIStore((s) => s.showToast);
  const [isConfirming, setIsConfirming] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // NW-HIGH-003 FIX: Use typed createReservation from reservations.ts instead of
  // raw fetch to /api/reservations. The old endpoint doesn't exist in the Next.js app.
  const handleConfirm = useCallback(async () => {
    setIsConfirming(true);
    try {
      await createReservation(storeSlug, {
        customerName: params.name ?? '',
        customerPhone: params.phone ?? '',
        partySize: params.guests,
        date: params.date,
        timeSlot: params.time,
      });
      showToast('Reservation confirmed!', 'success');
      setDismissed(true);
      onDismiss?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not confirm reservation';
      showToast(msg, 'error');
    } finally {
      setIsConfirming(false);
    }
  }, [params, storeSlug, showToast, onDismiss]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  if (dismissed) return null;

  return (
    <div
      className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
      role="region"
      aria-label="Reservation suggestion"
    >
      {/* Header */}
      <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-100">
        <p className="text-xs font-semibold text-indigo-700">Suggested Reservation</p>
      </div>

      {/* Details */}
      <div className="px-3 py-3 space-y-2">
        <div className="flex items-start gap-3">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span>{formatDate(params.date)}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <span>{formatTime(params.time)}</span>
          </div>

          {/* Guests */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span>{params.guests} guest{params.guests !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {(params.name || params.phone) && (
          <div className="text-xs text-gray-500">
            {params.name && <span>Name: {params.name}</span>}
            {params.name && params.phone && <span> &middot; </span>}
            {params.phone && <span>Phone: {params.phone}</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2 flex gap-2">
        <Button
          variant="primary"
          size="sm"
          loading={isConfirming}
          onClick={handleConfirm}
          className="flex-1"
          aria-label="Confirm reservation"
        >
          Confirm Reservation
        </Button>
        <button
          onClick={handleDismiss}
          disabled={isConfirming}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500',
            'border border-gray-200 bg-white hover:bg-gray-50',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Dismiss reservation suggestion"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
