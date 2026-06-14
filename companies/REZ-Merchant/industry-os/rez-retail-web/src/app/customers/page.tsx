'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Users, Mail, Phone, MoreVertical, Award } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
}

const tierColors = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-gray-200 text-gray-800',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-purple-100 text-purple-800',
  diamond: 'bg-blue-100 text-blue-800',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setCustomers([
        { id: '1', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98765 43210', tier: 'diamond', totalSpent: 125000, totalOrders: 45, lastPurchase: '2024-02-15' },
        { id: '2', name: 'Rahul Verma', email: 'rahul@example.com', phone: '+91 98765 43211', tier: 'platinum', totalSpent: 78000, totalOrders: 28, lastPurchase: '2024-02-14' },
        { id: '3', name: 'Anita Desai', email: 'anita@example.com', phone: '+91 98765 43212', tier: 'gold', totalSpent: 42000, totalOrders: 18, lastPurchase: '2024-02-12' },
        { id: '4', name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 98765 43213', tier: 'silver', totalSpent: 12000, totalOrders: 8, lastPurchase: '2024-02-10' },
        { id: '5', name: 'Kavita Nair', email: 'kavita@example.com', phone: '+91 98765 43214', tier: 'bronze', totalSpent: 3500, totalOrders: 3, lastPurchase: '2024-02-08' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-400 hover:text-gray-600">
                <Users className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Customers</h1>
            </div>
            <Link
              href="/customers/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600">
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[customer.tier]}`}>
                      <Award className="w-3 h-3" />
                      {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)}
                    </span>
                  </div>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">Total Spent</p>
                  <p className="font-semibold text-gray-900">₹{customer.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="font-semibold text-gray-900">{customer.totalOrders}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Purchase</p>
                  <p className="font-semibold text-gray-900">{new Date(customer.lastPurchase).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No customers found</p>
          </div>
        )}
      </main>
    </div>
  );
}
