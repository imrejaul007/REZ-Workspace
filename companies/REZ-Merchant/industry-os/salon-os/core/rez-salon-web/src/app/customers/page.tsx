'use client';

import { useState, useEffect } from 'react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  segment: 'new' | 'regular' | 'vip' | 'at_risk';
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulated data - replace with actual API calls
    const fetchCustomers = async () => {
      try {
        setCustomers([
          {
            id: '1',
            name: 'Priya Sharma',
            phone: '+91 98765 43210',
            email: 'priya@example.com',
            totalVisits: 15,
            totalSpent: 25000,
            lastVisit: '2024-01-10',
            segment: 'vip',
          },
          {
            id: '2',
            name: 'Anita Patel',
            phone: '+91 98765 43211',
            email: 'anita@example.com',
            totalVisits: 8,
            totalSpent: 12000,
            lastVisit: '2024-01-05',
            segment: 'regular',
          },
          {
            id: '3',
            name: 'Meera Gupta',
            phone: '+91 98765 43212',
            email: 'meera@example.com',
            totalVisits: 3,
            totalSpent: 3500,
            lastVisit: '2024-01-02',
            segment: 'new',
          },
          {
            id: '4',
            name: 'Sunita Verma',
            phone: '+91 98765 43213',
            email: 'sunita@example.com',
            totalVisits: 20,
            totalSpent: 45000,
            lastVisit: '2024-01-12',
            segment: 'vip',
          },
          {
            id: '5',
            name: 'Kavita Joshi',
            phone: '+91 98765 43214',
            email: 'kavita@example.com',
            totalVisits: 2,
            totalSpent: 1500,
            lastVisit: '2023-12-15',
            segment: 'at_risk',
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'regular':
        return 'bg-green-100 text-green-800';
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'at_risk':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <a href="/" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                    👤
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSegmentColor(customer.segment)}`}>
                  {customer.segment.toUpperCase()}
                </span>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900">{customer.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Visits:</span>
                  <span className="text-gray-900 font-medium">{customer.totalVisits}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Spent:</span>
                  <span className="text-gray-900 font-medium">₹{customer.totalSpent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Visit:</span>
                  <span className="text-gray-900">{customer.lastVisit}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  View Profile
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
