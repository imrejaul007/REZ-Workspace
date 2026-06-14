'use client';

import { useState } from 'react';

interface Booking {
  id: string;
  customerName: string;
  service: string;
  therapist: string;
  date: string;
  time: string;
  status: string;
}

export default function BookingsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'list' | 'calendar'>('calendar');

  const bookings: Booking[] = [
    { id: '1', customerName: 'Priya Sharma', service: 'Deep Tissue Massage', therapist: 'Anita', date: selectedDate, time: '10:00', status: 'confirmed' },
    { id: '2', customerName: 'Neha Patel', service: 'Facial Treatment', therapist: 'Meera', date: selectedDate, time: '11:30', status: 'in_progress' },
    { id: '3', customerName: 'Aisha Khan', service: 'Aromatherapy', therapist: 'Anita', date: selectedDate, time: '14:00', status: 'pending' },
    { id: '4', customerName: 'Ritu Agarwal', service: 'Hot Stone', therapist: 'Sunita', date: selectedDate, time: '15:30', status: 'confirmed' },
    { id: '5', customerName: 'Kavita Singh', service: 'Body Scrub', therapist: 'Meera', date: selectedDate, time: '17:00', status: 'pending' }
  ];

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <div className="flex gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              + New Booking
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg ${view === 'calendar' ? 'bg-purple-600 text-white' : 'bg-white'}`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg ${view === 'list' ? 'bg-purple-600 text-white' : 'bg-white'}`}
          >
            List View
          </button>
        </div>

        {view === 'calendar' ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {timeSlots.map(time => {
                const slotBookings = bookings.filter(b => b.time === time);
                return (
                  <div key={time} className="flex min-h-[80px]">
                    <div className="w-24 p-4 border-r border-gray-200 text-gray-500 font-medium">
                      {time}
                    </div>
                    <div className="flex-1 p-2">
                      {slotBookings.map(booking => (
                        <div
                          key={booking.id}
                          className="mb-2 p-3 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg cursor-pointer hover:bg-purple-100"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{booking.customerName}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{booking.service}</p>
                          <p className="text-xs text-gray-500">Therapist: {booking.therapist}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Therapist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{booking.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.service}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.therapist}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-purple-600 hover:underline mr-3">Edit</button>
                      <button className="text-red-600 hover:underline">Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
