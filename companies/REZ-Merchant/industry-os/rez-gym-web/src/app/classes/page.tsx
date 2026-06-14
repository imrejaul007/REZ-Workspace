'use client';

import { useState, useEffect } from 'react';

interface GymClass {
  id: string;
  name: string;
  type: string;
  trainer: string;
  schedule: string;
  time: string;
  enrolled: number;
  capacity: number;
  status: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setClasses([
      { id: '1', name: 'Morning Yoga', type: 'yoga', trainer: 'John Doe', schedule: 'Mon-Fri', time: '7:00 AM - 8:00 AM', enrolled: 12, capacity: 15, status: 'active' },
      { id: '2', name: 'HIIT Training', type: 'hiit', trainer: 'Jane Smith', schedule: 'Mon, Wed, Fri', time: '9:00 AM - 10:00 AM', enrolled: 18, capacity: 20, status: 'active' },
      { id: '3', name: 'Spinning', type: 'spinning', trainer: 'Mike Johnson', schedule: 'Tue, Thu, Sat', time: '6:00 PM - 7:00 PM', enrolled: 10, capacity: 15, status: 'active' },
      { id: '4', name: 'Evening Yoga', type: 'yoga', trainer: 'John Doe', schedule: 'Mon-Fri', time: '6:00 PM - 7:00 PM', enrolled: 14, capacity: 15, status: 'active' },
      { id: '5', name: 'Zumba', type: 'zumba', trainer: 'Sarah Lee', schedule: 'Wed, Sat', time: '5:00 PM - 6:00 PM', enrolled: 8, capacity: 25, status: 'active' },
      { id: '6', name: 'CrossFit', type: 'crossfit', trainer: 'Mike Johnson', schedule: 'Mon-Fri', time: '8:00 AM - 9:00 AM', enrolled: 20, capacity: 20, status: 'full' },
    ]);
    setLoading(false);
  }, []);

  const filteredClasses = classes.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'available') return c.enrolled < c.capacity;
    if (filter === 'full') return c.enrolled >= c.capacity;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
            <a href="/" className="text-blue-600 hover:text-blue-800">Back to Dashboard</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
            <button onClick={() => setFilter('available')} className={`px-4 py-2 rounded-lg ${filter === 'available' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Available</button>
            <button onClick={() => setFilter('full')} className={`px-4 py-2 rounded-lg ${filter === 'full' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Full</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trainer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClasses.map((gymClass) => (
                <tr key={gymClass.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{gymClass.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{gymClass.type}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{gymClass.trainer}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{gymClass.schedule}</div>
                    <div className="text-sm text-gray-500">{gymClass.time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(gymClass.enrolled / gymClass.capacity) * 100}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-500">{gymClass.enrolled}/{gymClass.capacity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${gymClass.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {gymClass.status === 'full' ? 'Full' : 'Open'}
                    </span>
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
