'use client';

import { useState } from 'react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalVisits: number;
  totalSpent: number;
  segment: string;
}

interface CustomerListProps {
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

export default function CustomerList({ customers, onSelectCustomer }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'totalSpent' | 'totalVisits'>('name');

  const filteredCustomers = customers
    .filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'totalSpent') return b.totalSpent - a.totalSpent;
      return b.totalVisits - a.totalVisits;
    });

  const getSegmentBadge = (segment: string) => {
    const colors: Record<string, string> = {
      vip: 'bg-purple-100 text-purple-800',
      regular: 'bg-green-100 text-green-800',
      new: 'bg-blue-100 text-blue-800',
      at_risk: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[segment] || 'bg-gray-100'}`}>
        {segment.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Sort */}
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'totalSpent' | 'totalVisits')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="totalSpent">Sort by Spending</option>
            <option value="totalVisits">Sort by Visits</option>
          </select>
        </div>
      </div>

      {/* Customer List */}
      <div className="divide-y">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="p-4 hover:bg-gray-50 cursor-pointer transition"
            onClick={() => onSelectCustomer(customer)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                  👤
                </div>
                <div className="ml-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{customer.name}</span>
                    {getSegmentBadge(customer.segment)}
                  </div>
                  <div className="text-sm text-gray-500">{customer.phone}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  ₹{customer.totalSpent.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">{customer.totalVisits} visits</div>
              </div>
            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No customers found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
