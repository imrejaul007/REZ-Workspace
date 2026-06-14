'use client';

import { useState, useCallback, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import type { CatalogItem, StaffMember, TimeSlot, AppointmentSlot } from '@/lib/types';

interface AppointmentBookingProps {
  open: boolean;
  onClose: () => void;
  service: CatalogItem;
  staff?: StaffMember;
  storeSlug: string;
  onBookingComplete: (confirmation: BookingConfirmation) => void;
  /** API function to fetch available slots */
  fetchSlots: (storeSlug: string, date: string, serviceId: string) => Promise<AppointmentSlot>;
  /** API function to create booking */
  createBooking: (
    storeSlug: string,
    payload: BookingPayload
  ) => Promise<BookingConfirmation>;
}

interface BookingPayload {
  serviceId: string;
  date: string;
  startTime: string;
  staffId?: string;
  customerPhone: string;
  customerName: string;
  notes?: string;
}

interface BookingConfirmation {
  confirmationCode: string;
  date: string;
  time: string;
  serviceName: string;
  staffName?: string;
}

type BookingStep = 'select-date' | 'select-time' | 'enter-details' | 'confirming' | 'confirmed' | 'error';

const DAYS_TO_SHOW = 14;

function generateDateRange(startDate: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < DAYS_TO_SHOW; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

function formatDate(dateStr: string): { day: string; date: number; month: string; weekday: string } {
  const date = new Date(dateStr + 'T12:00:00');
  return {
    day: date.toLocaleDateString('en-US', { day: 'numeric' }),
    date: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
  };
}

function TimeSlotGrid({
  slots,
  selectedTime,
  onSelect,
}: {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No available slots for this date</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.time}
          type="button"
          onClick={() => slot.available && onSelect(slot.time)}
          disabled={!slot.available}
          className={cn(
            'py-2.5 px-3 rounded-xl text-sm font-medium transition-all',
            !slot.available && 'bg-gray-100 text-gray-400 cursor-not-allowed',
            slot.available && selectedTime === slot.time
              ? 'bg-indigo-600 text-white shadow-md'
              : slot.available
              ? 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              : null
          )}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
}

export default function AppointmentBooking({
  open,
  onClose,
  service,
  staff,
  storeSlug,
  onBookingComplete,
  fetchSlots,
  createBooking,
}: AppointmentBookingProps) {
  const [step, setStep] = useState<BookingStep>('select-date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const dateRange = useMemo(() => generateDateRange(new Date()), []);

  const handleDateSelect = useCallback(
    async (date: string) => {
      setSelectedDate(date);
      setSelectedTime(null);
      setLoading(true);
      setError(null);

      try {
        const data = await fetchSlots(storeSlug, date, service.id);
        setSlots(data.slots);
        setStep('select-time');
      } catch (err) {
        setError('Failed to load available slots. Please try again.');
        logger.error('Error fetching slots:', { error: err });
      } finally {
        setLoading(false);
      }
    },
    [storeSlug, service.id, fetchSlots]
  );

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
    setStep('enter-details');
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.customerName = 'Name is required';
    }

    if (!customerPhone.trim()) {
      errors.customerPhone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(customerPhone.replace(/\s/g, ''))) {
      errors.customerPhone = 'Please enter a valid phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [customerName, customerPhone]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    if (!selectedDate || !selectedTime) return;

    setStep('confirming');
    setError(null);

    try {
      const payload: BookingPayload = {
        serviceId: service.id,
        date: selectedDate,
        startTime: selectedTime,
        staffId: staff?.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim() || undefined,
      };

      const result = await createBooking(storeSlug, payload);
      setConfirmation(result);
      setStep('confirmed');
      onBookingComplete(result);
    } catch (err) {
      setError('Failed to complete booking. Please try again.');
      setStep('enter-details');
      logger.error('Error creating booking:', { error: err });
    }
  }, [
    validateForm,
    selectedDate,
    selectedTime,
    service.id,
    staff,
    customerName,
    customerPhone,
    notes,
    createBooking,
    storeSlug,
    onBookingComplete,
  ]);

  const handleClose = useCallback(() => {
    setStep('select-date');
    setSelectedDate(null);
    setSelectedTime(null);
    setSlots([]);
    setError(null);
    setConfirmation(null);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setFormErrors({});
    onClose();
  }, [onClose]);

  const handleBack = useCallback(() => {
    if (step === 'select-time') {
      setStep('select-date');
      setSelectedTime(null);
    } else if (step === 'enter-details') {
      setStep('select-time');
    }
  }, [step]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        step === 'confirmed'
          ? 'Booking Confirmed!'
          : `Book: ${service.name}`
      }
      className="max-w-md"
    >
      <div className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Confirmed State */}
        {step === 'confirmed' && confirmation && (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{confirmation.confirmationCode}</p>
            <p className="text-sm text-gray-500 mb-4">Confirmation Code</p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-900">{confirmation.serviceName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">
                  {new Date(confirmation.date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-900">{confirmation.time}</span>
              </div>
              {confirmation.staffName && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Stylist</span>
                  <span className="font-medium text-gray-900">{confirmation.staffName}</span>
                </div>
              )}
            </div>

            <Button variant="primary" className="mt-6 w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}

        {/* Step 1: Select Date */}
        {step === 'select-date' && (
          <>
            <p className="text-sm text-gray-500 mb-3">Select a date</p>
            <div className="grid grid-cols-7 gap-1">
              {dateRange.map((date) => {
                const { day, month, weekday } = formatDate(date);
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      'p-2 rounded-xl text-center transition-colors',
                      selectedDate === date
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    <p className="text-[10px] uppercase tracking-wide opacity-70">{weekday}</p>
                    <p className="text-lg font-bold">{day}</p>
                    <p className="text-[10px] opacity-70">{month}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 2: Select Time */}
        {(step === 'select-time' || loading) && (
          <>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Back
              </button>
              <p className="text-sm text-gray-500">
                {selectedDate && formatDate(selectedDate).weekday},{' '}
                {selectedDate && formatDate(selectedDate).month}{' '}
                {selectedDate && formatDate(selectedDate).day}
              </p>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <TimeSlotGrid
                slots={slots}
                selectedTime={selectedTime}
                onSelect={handleTimeSelect}
              />
            )}
          </>
        )}

        {/* Step 3: Enter Details */}
        {step === 'enter-details' && (
          <>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Back
              </button>
              <p className="text-sm text-gray-500">
                {selectedDate && formatDate(selectedDate).month} {selectedDate && formatDate(selectedDate).day} at {selectedTime}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className={cn(
                    'w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500',
                    formErrors.customerName ? 'border-red-300' : 'border-gray-200'
                  )}
                />
                {formErrors.customerName && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.customerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={cn(
                    'w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500',
                    formErrors.customerPhone ? 'border-red-300' : 'border-gray-200'
                  )}
                />
                {formErrors.customerPhone && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.customerPhone}</p>
                )}
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or notes..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <p className="text-sm font-medium text-gray-900">{service.name}</p>
                {staff && <p className="text-xs text-gray-500">with {staff.name}</p>}
                <p className="text-xs text-gray-500">
                  {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  at {selectedTime}
                </p>
                <p className="text-sm font-bold text-gray-900 mt-2">{service.formattedPrice}</p>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleSubmit}
              >
                Confirm Booking
              </Button>
            </div>
          </>
        )}

        {/* Confirming State */}
        {step === 'confirming' && (
          <div className="py-12 flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-gray-500">Confirming your booking...</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
