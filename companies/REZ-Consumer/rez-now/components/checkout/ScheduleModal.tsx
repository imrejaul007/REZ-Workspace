'use client';

import { useState, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeOpenHours?: { open: string; close: string }; // "09:00", "22:00"
  onSchedule: (scheduledFor: string) => void; // ISO datetime string
}

type DayTab = 'today' | 'tomorrow';

/** Parse "HH:MM" into { hours, minutes } */
function parseTime(t: string): { hours: number; minutes: number } {
  const [h, m] = t.split(':').map(Number);
  return { hours: h, minutes: m };
}

/** Format a Date as "h:mm AM/PM" */
function formatSlot(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Format a Date as a short readable string: "Today, 2:30 PM" or "Tomorrow, 2:30 PM" */
export function formatScheduledTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const todayStr = now.toDateString();
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toDateString();
  const prefix = d.toDateString() === todayStr ? 'Today' : d.toDateString() === tomorrowStr ? 'Tomorrow' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${prefix}, ${formatSlot(d)}`;
}

function generateSlots(date: Date, openHHMM: string, closeHHMM: string): Date[] {
  const open = parseTime(openHHMM);
  const close = parseTime(closeHHMM);

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

export default function ScheduleModal({ isOpen, onClose, storeOpenHours, onSchedule }: ScheduleModalProps) {
  const openHHMM = storeOpenHours?.open ?? '10:00';
  const closeHHMM = storeOpenHours?.close ?? '22:00';

  const [activeTab, setActiveTab] = useState<DayTab>('today');
  const [selected, setSelected] = useState<Date | null>(null);

  const now = new Date();
  // Next available = now + 30 min buffer, rounded up to next 30-min boundary
  const bufferMs = 30 * 60 * 1000;
  const earliest = new Date(Math.ceil((now.getTime() + bufferMs) / (30 * 60 * 1000)) * (30 * 60 * 1000));

  const todayDate = new Date(now);
  todayDate.setHours(0, 0, 0, 0);

  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const slots = useMemo(() => {
    const base = activeTab === 'today' ? todayDate : tomorrowDate;
    return generateSlots(base, openHHMM, closeHHMM);
  }, [activeTab, openHHMM, closeHHMM, todayDate, tomorrowDate]);

  // Auto-highlight the next available slot when switching tabs
  const nextAvailableSlot = useMemo(() => {
    return slots.find((s) => s >= earliest) ?? null;
  }, [slots, earliest]);

  function isPast(slot: Date): boolean {
    return slot < earliest;
  }

  function handleConfirm() {
    if (!selected) return;
    onSchedule(selected.toISOString());
    onClose();
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Schedule order">
      {/* Day tabs */}
      <div className="flex gap-2 mb-4">
        {(['today', 'tomorrow'] as DayTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelected(null); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              activeTab === tab
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Time slots */}
      <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
        {slots.map((slot) => {
          const past = isPast(slot);
          const isNext = nextAvailableSlot && slot.getTime() === nextAvailableSlot.getTime();
          const isSelected = selected && slot.getTime() === selected.getTime();
          return (
            <button
              key={slot.toISOString()}
              disabled={past}
              onClick={() => setSelected(slot)}
              className={`relative py-2 rounded-xl text-xs font-medium border transition-colors
                ${past ? 'opacity-30 cursor-not-allowed bg-gray-50 border-gray-100 text-gray-400' : ''}
                ${!past && !isSelected ? 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:text-indigo-700' : ''}
                ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : ''}
              `}
            >
              {formatSlot(slot)}
              {isNext && !isSelected && (
                <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-green-400 ring-1 ring-white" />
              )}
            </button>
          );
        })}
      </div>

      {slots.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-6">No available slots for this day.</p>
      )}

      {/* Legend */}
      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
        Next available slot
      </p>

      {/* Actions */}
      <div className="flex gap-3 mt-5">
        <Button variant="ghost" size="md" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          disabled={!selected}
          onClick={handleConfirm}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
