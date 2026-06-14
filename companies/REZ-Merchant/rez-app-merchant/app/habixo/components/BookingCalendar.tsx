// Habixo Booking Calendar Component
// Calendar view for managing booking availability
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState, useMemo } from 'react';

// Types
export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  bookings: CalendarBooking[];
  isBlocked: boolean;
}

export interface CalendarBooking {
  id: string;
  guestName: string;
  status: 'confirmed' | 'pending' | 'checked_in' | 'checked_out';
  checkIn: Date;
  checkOut: Date;
}

export interface BookingCalendarProps {
  bookings: CalendarBooking[];
  blockedDates?: Date[];
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (month: Date) => void;
  selectedPropertyId?: string;
}

// Helper functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLORS = {
  confirmed: '#10b981',
  pending: '#f59e0b',
  checked_in: '#6366f1',
  checked_out: '#6b7280',
};

export function BookingCalendar({
  bookings,
  blockedDates = [],
  onDateSelect,
  onMonthChange,
  selectedPropertyId,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Filter bookings for selected property
  const filteredBookings = selectedPropertyId
    ? bookings.filter((b) => b.propertyId === selectedPropertyId)
    : bookings;

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    // Previous month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date,
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        bookings: getBookingsForDate(date, filteredBookings),
        isBlocked: isDateBlocked(date, blockedDates),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        bookings: getBookingsForDate(date, filteredBookings),
        isBlocked: isDateBlocked(date, blockedDates),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        bookings: getBookingsForDate(date, filteredBookings),
        isBlocked: isDateBlocked(date, blockedDates),
      });
    }

    return days;
  }, [year, month, selectedDate, bookings, blockedDates, filteredBookings]);

  function getBookingsForDate(date: Date, bookings: CalendarBooking[]): CalendarBooking[] {
    return bookings.filter((booking) =>
      isDateInRange(date, booking.checkIn, booking.checkOut)
    );
  }

  function isDateBlocked(date: Date, blockedDates: Date[]): boolean {
    return blockedDates.some((blocked) => isSameDay(date, blocked));
  }

  function handlePrevMonth() {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  }

  function handleNextMonth() {
    const newDate = new Date(year, month + 1, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  }

  function handleDatePress(day: CalendarDay) {
    if (!day.isCurrentMonth || day.isBlocked) return;
    setSelectedDate(day.date);
    onDateSelect?.(day.date);
  }

  // Get bookings for selected date
  const selectedDateBookings = selectedDate
    ? getBookingsForDate(selectedDate, filteredBookings)
    : [];

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTHS[month]} {year}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {DAYS.map((day) => (
          <View key={day} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendar}>
        {calendarDays.map((day, index) => {
          const hasBooking = day.bookings.length > 0;
          const bookingColor = hasBooking
            ? STATUS_COLORS[day.bookings[0].status]
            : undefined;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                !day.isCurrentMonth && styles.dayCellOtherMonth,
                day.isToday && styles.dayCellToday,
                day.isSelected && styles.dayCellSelected,
                day.isBlocked && styles.dayCellBlocked,
                hasBooking && { borderColor: bookingColor, borderWidth: 2 },
              ]}
              onPress={() => handleDatePress(day)}
              disabled={!day.isCurrentMonth || day.isBlocked}
            >
              <Text
                style={[
                  styles.dayText,
                  !day.isCurrentMonth && styles.dayTextOtherMonth,
                  day.isToday && styles.dayTextToday,
                  day.isSelected && styles.dayTextSelected,
                  day.isBlocked && styles.dayTextBlocked,
                ]}
              >
                {day.day}
              </Text>
              {hasBooking && (
                <View style={[styles.bookingDot, { backgroundColor: bookingColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.confirmed }]} />
          <Text style={styles.legendText}>Confirmed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.pending }]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.checked_in }]} />
          <Text style={styles.legendText}>Checked In</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Blocked</Text>
        </View>
      </View>

      {/* Selected date bookings */}
      {selectedDate && (
        <View style={styles.selectedDateSection}>
          <Text style={styles.selectedDateTitle}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          {selectedDateBookings.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedDateBookings.map((booking) => (
                <View
                  key={booking.id}
                  style={[
                    styles.bookingCard,
                    { borderLeftColor: STATUS_COLORS[booking.status] },
                  ]}
                >
                  <Text style={styles.bookingGuestName}>{booking.guestName}</Text>
                  <Text style={styles.bookingStatus}>
                    {booking.status.replace('_', ' ')}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noBookingsText}>No bookings on this date</Text>
          )}
        </View>
      )}
    </View>
  );
}

// Mini calendar for dashboard
export function MiniCalendar({ bookings, onDateSelect }: Pick<BookingCalendarProps, 'bookings' | 'onDateSelect'>) {
  const today = new Date();

  return (
    <BookingCalendar
      bookings={bookings}
      onDateSelect={onDateSelect}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: '#e0e7ff',
  },
  dayCellSelected: {
    backgroundColor: '#6366f1',
  },
  dayCellBlocked: {
    backgroundColor: '#fee2e2',
  },
  dayText: {
    fontSize: 14,
    color: '#1f2937',
  },
  dayTextOtherMonth: {
    color: '#9ca3af',
  },
  dayTextToday: {
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dayTextBlocked: {
    color: '#ef4444',
  },
  bookingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedDateSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  bookingCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    borderLeftWidth: 4,
    minWidth: 120,
  },
  bookingGuestName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  bookingStatus: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  noBookingsText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default BookingCalendar;
