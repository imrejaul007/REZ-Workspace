'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useStore } from '../StoreContextProvider';
import { useAuthStore } from '@/lib/store/authStore';
import { getAvailability, createReservation, TimeSlot, ReservationConfirmation } from '@/lib/api/reservations';

type Step = 'date' | 'party' | 'time' | 'contact' | 'notes' | 'done';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildICS(confirmation: ReservationConfirmation, storeName: string): string {
  const [year, month, day] = confirmation.date.split('-').map(Number);
  const [hour, minute] = confirmation.timeSlot.split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  const endHour = hour + 1;
  const dtEnd = `${year}${pad(month)}${pad(day)}T${pad(endHour)}${pad(minute)}00`;
  const uid = `${confirmation.reservationCode}@rez.money`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//REZ Now//Table Reservation//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Table at ${storeName} (${confirmation.reservationCode})`,
    `DESCRIPTION:${confirmation.confirmationMessage.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export default function ReservationClient({ storeSlug }: { storeSlug: string }) {
  const { store } = useStore();
  const t = useTranslations('reservation');
  const user = useAuthStore((s) => s.user);

  // Build next 14 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: string[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<string>(dates[0]);
  const [partySize, setPartySize] = useState(2);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ReservationConfirmation | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadSlots = useCallback(
    async (date: string) => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const result = await getAvailability(storeSlug, date);
        setSlots(result);
      } catch (err: unknown) {
        setSlotsError(err instanceof Error ? err.message : 'Failed to load slots');
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [storeSlug],
  );

  const goToParty = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep('party');
  };

  const goToTime = async () => {
    setStep('time');
    await loadSlots(selectedDate);
  };

  const goToContact = (time: string) => {
    setSelectedTime(time);
    setStep('contact');
  };

  const goToNotes = () => {
    if (!name.trim() || !phone.trim()) return;
    setStep('notes');
  };

  const handleSubmit = async () => {
    if (!selectedTime) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createReservation(storeSlug, {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        partySize,
        date: selectedDate,
        timeSlot: selectedTime,
        notes: notes.trim() || undefined,
      });
      setConfirmation(result);
      setStep('done');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!confirmation) return;
    const ics = buildICS(confirmation, store.name);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservation-${confirmation.reservationCode}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDirections = () => {
    const query = encodeURIComponent(store.address || store.name);
    window.open(`https://maps.google.com/?q=${query}`, '_blank', 'noopener');
  };

  // ── Step: done ─────────────────────────────────────────────────────────────
  if (step === 'done' && confirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 space-y-5">
          <div className="text-center">
            <span className="text-4xl" aria-hidden="true">&#x2713;</span>
            <h1 className="mt-2 text-xl font-bold text-gray-900">{store.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('title')}</p>
          </div>

          <div className="bg-indigo-50 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide mb-1">{t('code')}</p>
            <p className="font-mono text-2xl font-bold text-indigo-700 tracking-widest">
              {confirmation.reservationCode}
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('selectDate')}</span>
              <span className="font-medium">{formatDate(confirmation.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('selectTime')}</span>
              <span className="font-medium">{confirmation.timeSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('partySize')}</span>
              <span className="font-medium">{partySize}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAddToCalendar}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {t('addCalendar')}
            </button>
            <button
              onClick={handleDirections}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {t('directions')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{store.name}</p>
      </div>

      <div className="px-4 pt-5 space-y-6">

        {/* ── Step: Date picker ──────────────────────────────────────────────── */}
        <section aria-labelledby="date-heading">
          <h2 id="date-heading" className="text-sm font-semibold text-gray-700 mb-2">{t('selectDate')}</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {dates.map((d, idx) => {
              const isToday = idx === 0;
              const isSelected = d === selectedDate;
              const label = isToday ? 'Today' : formatDate(d);
              return (
                <button
                  key={d}
                  onClick={() => goToParty(d)}
                  aria-pressed={isSelected}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Step: Party size ──────────────────────────────────────────────── */}
        {(step === 'party' || step === 'time' || step === 'contact' || step === 'notes') && (
          <section aria-labelledby="party-heading">
            <h2 id="party-heading" className="text-sm font-semibold text-gray-700 mb-2">{t('partySize')}</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPartySize((p) => Math.max(1, p - 1))}
                aria-label="Decrease party size"
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-700 text-lg font-bold flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
                disabled={partySize <= 1}
              >
                -
              </button>
              <span className="text-xl font-bold text-gray-900 w-6 text-center" aria-live="polite">{partySize}</span>
              <button
                onClick={() => setPartySize((p) => Math.min(20, p + 1))}
                aria-label="Increase party size"
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-700 text-lg font-bold flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
                disabled={partySize >= 20}
              >
                +
              </button>
            </div>
            {step === 'party' && (
              <button
                onClick={goToTime}
                className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {t('selectTime')}
              </button>
            )}
          </section>
        )}

        {/* ── Step: Time slots ──────────────────────────────────────────────── */}
        {(step === 'time' || step === 'contact' || step === 'notes') && (
          <section aria-labelledby="time-heading">
            <h2 id="time-heading" className="text-sm font-semibold text-gray-700 mb-2">{t('selectTime')}</h2>
            {slotsLoading ? (
              <p className="text-sm text-gray-400 py-4 text-center" role="status">{t('selectTime')}…</p>
            ) : slotsError ? (
              <p className="text-sm text-red-500 py-4 text-center">{slotsError}</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">{t('unavailable')}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2" role="group" aria-label={t('selectTime')}>
                {slots.map((slot) => {
                  const isSelected = slot.time === selectedTime;
                  return (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && goToContact(slot.time)}
                      disabled={!slot.available}
                      aria-pressed={isSelected}
                      aria-label={`${slot.time}${!slot.available ? ' – ' + t('fullyBooked') : ''}`}
                      className={`py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        !slot.available
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      {slot.time}
                      {!slot.available && (
                        <span className="block text-xs font-normal">{t('fullyBooked')}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Step: Contact ────────────────────────────────────────────────── */}
        {(step === 'contact' || step === 'notes') && (
          <section aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="text-sm font-semibold text-gray-700 mb-3">{t('yourDetails')}</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="res-name" className="block text-xs text-gray-500 mb-1">{t('name')}</label>
                <input
                  id="res-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="res-phone" className="block text-xs text-gray-500 mb-1">{t('phone')}</label>
                <input
                  id="res-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="+91 98765 43210"
                />
              </div>
              {step === 'contact' && (
                <button
                  onClick={goToNotes}
                  disabled={!name.trim() || !phone.trim()}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              )}
            </div>
          </section>
        )}

        {/* ── Step: Notes ──────────────────────────────────────────────────── */}
        {step === 'notes' && (
          <section aria-labelledby="notes-heading">
            <h2 id="notes-heading" className="text-sm font-semibold text-gray-700 mb-2">{t('notes')}</h2>
            <textarea
              id="res-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              rows={3}
              maxLength={200}
              placeholder="Any dietary requirements, accessibility needs..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{notes.length}/200</p>

            {submitError && (
              <p className="text-sm text-red-500 mt-2" role="alert">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-3 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {submitting ? 'Confirming…' : t('confirm')}
            </button>
          </section>
        )}

      </div>
    </div>
  );
}
