'use client';

import { useState, useEffect } from 'react';

// Types
interface Booking {
  _id: string;
  productName: string;
  productSerial: string;
  serviceCenter: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('http://localhost:4003/api/bookings');
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings || mockBookings);
      } else {
        setBookings(mockBookings);
      }
    } catch {
      setBookings(mockBookings);
    }
    setLoading(false);
  };

  const mockBookings: Booking[] = [
    {
      _id: '1',
      productName: 'Samsung Galaxy S24 Ultra',
      productSerial: 'SN-2024-001234',
      serviceCenter: 'TechCare Solutions',
      serviceType: 'Screen Repair',
      scheduledDate: '2026-06-10',
      scheduledTime: '11:00 AM',
      status: 'scheduled',
      notes: 'Cracked screen - replacement needed'
    },
    {
      _id: '2',
      productName: 'MacBook Pro 14"',
      productSerial: 'SN-2023-005678',
      serviceCenter: 'QuickFix Electronics',
      serviceType: 'Battery Replacement',
      scheduledDate: '2026-06-08',
      scheduledTime: '2:00 PM',
      status: 'scheduled',
      notes: 'Battery draining fast'
    },
    {
      _id: '3',
      productName: 'iPhone 15 Pro',
      productSerial: 'SN-2024-009012',
      serviceCenter: 'Gadget Hospital',
      serviceType: 'Water Damage',
      scheduledDate: '2026-06-05',
      scheduledTime: '10:00 AM',
      status: 'completed',
      notes: 'Phone fell in water - drying and cleaning done'
    },
    {
      _id: '4',
      productName: 'OnePlus 12',
      productSerial: 'SN-2024-003456',
      serviceCenter: 'TechCare Solutions',
      serviceType: 'Software Issues',
      scheduledDate: '2026-06-03',
      scheduledTime: '3:00 PM',
      status: 'completed',
      notes: 'OS reinstalled, data recovered'
    }
  ];

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'scheduled') return booking.status === 'scheduled' || booking.status === 'in_progress';
    if (filter === 'completed') return booking.status === 'completed' || booking.status === 'cancelled';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return '📅';
      case 'in_progress': return '🔧';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600 mt-1">Track your service appointments</p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
              <span>+</span> New Booking
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            {(['all', 'scheduled', 'completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === tab
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'scheduled' && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {bookings.filter(b => b.status === 'scheduled' || b.status === 'in_progress').length}
                  </span>
                )}
                {tab === 'completed' && (
                  <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                    {bookings.filter(b => b.status === 'completed' || b.status === 'cancelled').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-gray-500 text-sm">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-gray-500 text-sm">Scheduled</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {bookings.filter(b => b.status === 'scheduled').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-gray-500 text-sm">In Progress</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {bookings.filter(b => b.status === 'in_progress').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {bookings.filter(b => b.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <div key={booking._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                    {getStatusIcon(booking.status)}
                  </div>
                </div>

                {/* Booking Details */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{booking.productName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <p className="text-gray-500 text-xs">Service</p>
                      <p className="text-gray-900 text-sm font-medium">{booking.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Service Center</p>
                      <p className="text-gray-900 text-sm font-medium">{booking.serviceCenter}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Date & Time</p>
                      <p className="text-gray-900 text-sm font-medium">{booking.scheduledDate}</p>
                      <p className="text-gray-600 text-xs">{booking.scheduledTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Serial</p>
                      <p className="text-gray-900 text-sm font-mono">{booking.productSerial}</p>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-xs mb-1">Notes</p>
                      <p className="text-gray-700 text-sm">{booking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {booking.status === 'scheduled' && (
                    <>
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                        Reschedule
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                        Cancel
                      </button>
                    </>
                  )}
                  {booking.status === 'completed' && (
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                      View Report
                    </button>
                  )}
                  {booking.status === 'in_progress' && (
                    <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm">
                      Track Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredBookings.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500 mb-6">You don't have any {filter !== 'all' ? filter : ''} bookings yet.</p>
              <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Book a Service
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
