'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

interface Booking {
  id: string;
  time: string;
  customerName: string;
  service: string;
  status: string;
}

interface DayBookings {
  date: Date;
  bookings: Booking[];
}

export default function BookingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of month for padding
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  // Simulated bookings data
  const getBookingsForDate = (date: Date): Booking[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Simulated data
    if (dateStr === format(new Date(), 'yyyy-MM-dd')) {
      return [
        { id: '1', time: '10:00 AM', customerName: 'Priya Sharma', service: 'Hair Coloring', status: 'confirmed' },
        { id: '2', time: '11:30 AM', customerName: 'Anita Patel', service: 'Haircut', status: 'pending' },
        { id: '3', time: '2:00 PM', customerName: 'Meera Gupta', service: 'Facial', status: 'confirmed' },
      ];
    }
    return [];
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            →
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding days from previous month */}
        {paddingDays.map((_, index) => (
          <div key={`pad-${index}`} className="h-24 bg-gray-50 rounded" />
        ))}

        {/* Days of current month */}
        {days.map((day) => {
          const dayBookings = getBookingsForDate(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`h-24 border rounded p-1 ${
                isCurrentDay ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>
              <div className="mt-1 space-y-1 overflow-hidden">
                {dayBookings.slice(0, 2).map((booking) => (
                  <div
                    key={booking.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {booking.time} {booking.customerName.split(' ')[0]}
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-xs text-gray-500">+{dayBookings.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
