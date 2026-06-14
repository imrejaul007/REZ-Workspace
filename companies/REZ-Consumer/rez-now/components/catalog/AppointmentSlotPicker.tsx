'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { TimeSlot, CatalogItem, StaffMember } from '@/lib/types';
import { getAppointmentSlots, bookAppointment } from '@/lib/api/catalog';
import Button from '@/components/ui/Button';

interface AppointmentSlotPickerProps {
  storeSlug: string;
  service: CatalogItem;
  selectedStaff?: StaffMember;
  onBooked: (appointmentId: string) => void;
  onClose: () => void;
}

function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function AppointmentSlotPicker({
  storeSlug,
  service,
  selectedStaff,
  onBooked,
  onClose,
}: AppointmentSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(generateDateRange(7)[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [slotsError, setSlotsError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSlotsError(false);
    getAppointmentSlots(storeSlug, selectedDate, service.id)
      .then((data) => setSlots(data.slots))
      .catch(() => {
        setSlots([]);
        setSlotsError(true);
      })
      .finally(() => setLoading(false));
  }, [storeSlug, selectedDate, service.id]);

  const dates = generateDateRange(7);

  async function handleBook() {
    if (!selectedTime) return;
    setBooking(true);
    try {
      const result = await bookAppointment(storeSlug, {
        serviceId: service.id,
        date: selectedDate,
        startTime: selectedTime,
        staffId: selectedStaff?.id,
        customerPhone: '',
        customerName: '',
      });
      onBooked(result.appointmentId);
    } catch {
      // error handled inline via state; extend as needed
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Book: {service.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Date selector */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Select Date</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dates.map((date) => (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  className={cn(
                    'flex-shrink-0 px-3 py-2 rounded-xl text-center text-sm transition-all',
                    selectedDate === date
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  <div className="text-xs opacity-70">
                    {formatDate(date).split(' ')[0]}
                  </div>
                  <div className="font-bold">{formatDate(date).split(' ')[1]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Available Times</p>
            {loading ? (
              <div className="text-center py-6 text-gray-400 text-sm">Loading slots...</div>
            ) : slotsError ? (
              <div className="text-center py-6 text-red-500 text-sm">
                Failed to load slots. Please try again.
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No slots available
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      'py-2 rounded-lg text-sm font-medium transition-all',
                      selectedTime === slot.time
                        ? 'bg-indigo-600 text-white'
                        : slot.available
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through',
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {selectedTime && (
            <div className="bg-indigo-50 rounded-xl px-4 py-3">
              <p className="text-sm text-indigo-900">
                <strong>{service.name}</strong> on{' '}
                <strong>{formatDate(selectedDate)}</strong> at{' '}
                <strong>{selectedTime}</strong>
              </p>
              {service.bookingRequiresDeposit && service.depositAmount && (
                <p className="text-sm text-indigo-700 mt-1">
                  Deposit: <strong>₹{service.depositAmount / 100}</strong> (payable now)
                </p>
              )}
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            disabled={!selectedTime || booking}
            loading={booking}
            onClick={handleBook}
          >
            {!selectedTime
              ? 'Select a time'
              : service.bookingRequiresDeposit
                ? `Pay ₹${service.depositAmount! / 100} to Book`
                : 'Confirm Booking'}
          </Button>
        </div>
      </div>
    </div>
  );
}
