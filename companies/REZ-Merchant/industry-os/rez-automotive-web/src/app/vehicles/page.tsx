'use client';

import { useState, useEffect } from 'react';

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  customer: string;
  status: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    setVehicles([
      { id: '1', registrationNumber: 'MH12AB1234', make: 'Maruti', model: 'Swift', year: 2022, customer: 'Rahul Sharma', status: 'active' },
      { id: '2', registrationNumber: 'MH14CD5678', make: 'Hyundai', model: 'i20', year: 2021, customer: 'Priya Patel', status: 'active' },
      { id: '3', registrationNumber: 'DL01EF9012', make: 'Honda', model: 'City', year: 2023, customer: 'Amit Singh', status: 'active' }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Vehicle</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg. Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{v.registrationNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{v.make} {v.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{v.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{v.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:underline mr-3">View</button>
                    <button className="text-gray-600 hover:underline">Edit</button>
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
