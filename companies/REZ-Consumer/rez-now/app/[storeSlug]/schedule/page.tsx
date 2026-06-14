'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../StoreContextProvider';
import { useCartStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseHHMM(t: string): { hours: number; minutes: number } {
  const [h, m] = t.split(':').map(Number);
  return { hours: h, minutes: m };
}

function formatSlot(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDayLabel(d: Date, today: Date): string {
  const todayStr = today.toDateString();
  const targetStr = d.toDateString();
  if (targetStr === todayStr) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (targetStr === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function generateDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

function generateSlots(date: Date, openHHMM: string, closeHHMM: string): Date[] {
  const open = parseHHMM(openHHMM);
  const close = parseHHMM(closeHHMM);

  const slots: Date[] = [];
  const cursor = new Date(date);
  cursor.setHours(open.hours, open.minutes, 0, 0);

  const end = new Date(date);
  end.setHours(close.hours, close.minutes, 0, 0);

  while (cursor < end) {
    slots.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + 30);
  }
  return slots;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const router = useRouter();
  const { store } = useStore();
  const { setScheduledFor, storeSlug } = useCartStore();
  const { showToast } = useUIStore();

  const now = new Date();
  // Earliest bookable slot = now + 30 min, rounded up to next 30-min boundary
  const earliest = new Date(
    Math.ceil((now.getTime() + 30 * 60 * 1000) / (30 * 60 * 1000)) * (30 * 60 * 1000)
  );

  const days = useMemo(() => generateDays(7), []);
  const [selectedDay, setSelectedDay] = useState<Date>(days[0]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const todayForLabel = new Date();
  todayForLabel.setHours(0, 0, 0, 0);

  const dayKey = selectedDay.toLocaleDateString('en-IN', { weekday: 'long' }).toLowerCase();
  const hours = store.operatingHours?.[dayKey] ?? null;
  const openHHMM = hours?.open ?? '10:00';
  const closeHHMM = hours?.close ?? '22:00';

  const slots = useMemo(
    () => generateSlots(selectedDay, openHHMM, closeHHMM),
    [selectedDay, openHHMM, closeHHMM]
  );

  const availableSlots = slots.filter((s) => s >= earliest);

  function handleConfirm() {
    if (!selectedSlot) return;
    setScheduledFor(selectedSlot.toISOString());
    showToast(`Scheduled for ${formatDayLabel(selectedSlot, todayForLabel)}, ${formatSlot(selectedSlot)}`, 'success');
    router.push(`/${storeSlug}/checkout`);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="text-gray-500 hover:text-gray-900"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Schedule your order</h1>
          <p className="text-xs text-gray-500">{store.name}</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Day selector — pill row */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Select a date
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {days.map((day) => {
              const isActive = day.toDateString() === selectedDay.toDateString();
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDay(day);
                    setSelectedSlot(null);
                  }}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap
                    ${isActive
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                >
                  {formatDayLabel(day, todayForLabel)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Select a time
          </p>

          {availableSlots.length === 0 ? (
            <div className="bg-white rounded-xl px-4 py-8 text-center">
              <svg
                className="w-8 h-8 text-gray-300 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-500">No available slots for this day.</p>
              <p className="text-xs text-gray-400 mt-1">Try selecting a different date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot) => {
                const isSelected = selectedSlot?.getTime() === slot.getTime();
                return (
                  <button
                    key={slot.toISOString()}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-colors
                      ${isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:text-indigo-700'
                      }`}
                  >
                    {formatSlot(slot)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selection summary */}
        {selectedSlot && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <svg
              className="w-5 h-5 text-indigo-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-indigo-800 font-medium">
              {formatDayLabel(selectedSlot, todayForLabel)}, {formatSlot(selectedSlot)}
            </p>
          </div>
        )}
      </div>

      {/* Sticky confirm button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <button
          onClick={handleConfirm}
          disabled={!selectedSlot}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-colors
            ${selectedSlot
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          {selectedSlot
            ? `Confirm — ${formatDayLabel(selectedSlot, todayForLabel)}, ${formatSlot(selectedSlot)}`
            : 'Select a time slot'}
        </button>
      </div>
    </div>
  );
}
