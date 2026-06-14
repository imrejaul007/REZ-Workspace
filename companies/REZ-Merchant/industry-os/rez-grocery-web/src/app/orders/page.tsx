'use client';

import { useState } from 'react';

export default function OrdersPage() {
  const orders = [
    { id: '1', orderNumber: 'ORD-001', customer: 'Rahul Sharma', items: 5, total: 1250, status: 'delivered' },
    { id: '2', orderNumber: 'ORD-002', customer: 'Priya Patel', items: 3, total: 890, status: 'in_transit' },
    { id: '3', orderNumber: 'ORD-003', customer: 'Amit Singh', items: 8, total: 2100, status: 'pending' },
    { id: '4', orderNumber: 'ORD-004', customer: 'Sneha Gupta', items: 4, total: 650, status: 'delivered' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{o.orderNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{o.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{o.items}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{o.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(o.status)}`}>{o.status.replace('_', ' ')}</span>
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
