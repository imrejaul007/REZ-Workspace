// React SDK Components for REZ Schedule
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createClient, ReZSchedule, EventType, Booking, TimeSlot } from './index';

interface ReZScheduleContextValue {
  client: ReZSchedule | null;
  loading: boolean;
  error: string | null;
  eventTypes: EventType[];
  availability: { slots: TimeSlot[] };
  fetchEventTypes: () => Promise<void>;
  fetchAvailability: (username: string, slug: string, startDate: string, endDate: string) => Promise<void>;
  createBooking: (data: {
    eventTypeId: string;
    startTime: string;
    endTime: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone?: string;
    timezone?: string;
  }) => Promise<Booking>;
  cancelBooking: (uid: string, reason?: string) => Promise<Booking>;
}

const ReZScheduleContext = createContext<ReZScheduleContextValue | null>(null);

interface ReZScheduleProviderProps {
  children: ReactNode;
  apiKey: string;
  baseUrl?: string;
}

export function ReZScheduleProvider({ children, apiKey, baseUrl }: ReZScheduleProviderProps) {
  const [client] = useState(() => createClient({ apiKey, baseUrl }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [availability, setAvailability] = useState<{ slots: TimeSlot[] }>({ slots: [] });

  const fetchEventTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const types = await client.eventTypes.list();
      setEventTypes(types);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event types');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchAvailability = useCallback(async (
    username: string,
    slug: string,
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const slots = await client.availability.get({ username, slug, startDate, endDate });
      setAvailability(slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const createBooking = useCallback(async (data: Parameters<typeof client.bookings.create>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const booking = await client.bookings.create(data);
      return booking;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const cancelBooking = useCallback(async (uid: string, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const booking = await client.bookings.cancel(uid, { reason });
      return booking;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return (
    <ReZScheduleContext.Provider value={{
      client,
      loading,
      error,
      eventTypes,
      availability,
      fetchEventTypes,
      fetchAvailability,
      createBooking,
      cancelBooking,
    }}>
      {children}
    </ReZScheduleContext.Provider>
  );
}

export function useReZSchedule() {
  const context = useContext(ReZScheduleContext);
  if (!context) {
    throw new Error('useReZSchedule must be used within ReZScheduleProvider');
  }
  return context;
}

// Booking Widget Component
interface BookingWidgetProps {
  username: string;
  slug: string;
  theme?: 'light' | 'dark';
  primaryColor?: string;
  onBookingComplete?: (booking: Booking) => void;
  onError?: (error: Error) => void;
}

export function BookingWidget({
  username,
  slug,
  theme = 'light',
  primaryColor = '#6366f1',
  onBookingComplete,
  onError,
}: BookingWidgetProps) {
  const { client, availability, fetchAvailability, createBooking, loading, error } = useReZSchedule();
  const [step, setStep] = useState<'date' | 'time' | 'form' | 'success'>('date');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });

  // Fetch availability when component mounts
  React.useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    fetchAvailability(username, slug, today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]);
  }, [username, slug, fetchAvailability]);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !client) return;

    try {
      const booking = await createBooking({
        eventTypeId: selectedSlot.eventTypeId || '',
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        attendeeName: guestInfo.name,
        attendeeEmail: guestInfo.email,
        attendeePhone: guestInfo.phone || undefined,
      });
      setStep('success');
      onBookingComplete?.(booking);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Booking failed'));
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        background: isDark ? '#1f2937' : '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
          color: 'white',
          padding: '24px',
          textAlign: 'center',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '18px' }}>Book Appointment</h3>
        <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '14px' }}>
          with {username} • {slug}
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Loading...
        </div>
        )}

        {error && (
          <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px' }}>
            {error}
        </div>
        )}

        {/* Time Slots */}
        {step === 'date' && (
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#6b7280' }}>
              Select a Time
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {availability.slots
                .filter(s => s.available)
                .slice(0, 9)
                .map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => handleSlotSelect(slot)}
                    style={{
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {new Date(slot.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Guest Form */}
        {step === 'form' && selectedSlot && (
          <form onSubmit={handleSubmit}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>
              Your Details
            </h4>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Name *</label>
              <input
                type="text"
                required
                value={guestInfo.name}
                onChange={e => setGuestInfo({ ...guestInfo, name: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Email *</label>
              <input
                type="email"
                required
                value={guestInfo.email}
                onChange={e => setGuestInfo({ ...guestInfo, email: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        )}

        {/* Success */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                background: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'white',
                fontSize: '32px',
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: '0 0 8px' }}>Booking Confirmed!</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>
              You will receive a confirmation email shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Export hooks and utilities
export { useReZSchedule as useSchedule };
export { createClient };
export type { EventType, Booking, TimeSlot };
