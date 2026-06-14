'use client';

import { useState, useEffect } from 'react';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  price: number;
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    setMedicines([
      { id: '1', name: 'Paracetamol 500mg', genericName: 'Acetaminophen', manufacturer: 'Cipla', batchNumber: 'BATCH001', expiryDate: '2025-12', quantity: 500, price: 25 },
      { id: '2', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', manufacturer: 'Sun Pharma', batchNumber: 'BATCH002', expiryDate: '2025-06', quantity: 200, price: 85 },
      { id: '3', name: 'Omeprazole 20mg', genericName: 'Omeprazole', manufacturer: 'Dr. Reddy\'s', batchNumber: 'BATCH003', expiryDate: '2026-03', quantity: 350, price: 45 }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">+ Add Medicine</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {medicines.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{m.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.genericName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{m.batchNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{m.expiryDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={m.quantity < 100 ? 'text-red-600 font-medium' : ''}>{m.quantity}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{m.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
