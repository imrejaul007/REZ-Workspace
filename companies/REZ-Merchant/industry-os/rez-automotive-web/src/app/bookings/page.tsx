'use client';

import { useState } from 'react';

export default function BookingsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const bookings = [
    { id: '1', vehicle: 'MH12AB1234', service: 'Oil Change', time: '10:00', technician: 'John', status: 'scheduled' },
    { id: '2', vehicle: 'MH14CD5678', service: 'Full Service', time: '11:30', technician: 'Mike', status: 'in_progress' },
    { id: '3', vehicle: 'DL01EF9012', service: 'Tire Rotation', time: '14:00', technician: 'John', status: 'scheduled' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <div className="flex gap-4">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg" />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Booking</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{b.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{b.vehicle}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{b.service}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{b.technician}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(b.status)}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
