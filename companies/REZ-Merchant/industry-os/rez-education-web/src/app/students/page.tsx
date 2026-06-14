'use client';

import { useState, useEffect } from 'react';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  batch: string;
  attendance: number;
  status: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setStudents([
      { id: '1', name: 'Rahul Kumar', email: 'rahul@email.com', phone: '9876543210', course: 'Web Development', batch: 'WD-2024-A', attendance: 92, status: 'active' },
      { id: '2', name: 'Priya Singh', email: 'priya@email.com', phone: '9876543211', course: 'Data Science', batch: 'DS-2024-A', attendance: 88, status: 'active' },
      { id: '3', name: 'Amit Sharma', email: 'amit@email.com', phone: '9876543212', course: 'Digital Marketing', batch: 'DM-2024-A', attendance: 95, status: 'active' },
      { id: '4', name: 'Sneha Gupta', email: 'sneha@email.com', phone: '9876543213', course: 'UI/UX Design', batch: 'UX-2024-A', attendance: 85, status: 'active' },
      { id: '5', name: 'Vikram Patel', email: 'vikram@email.com', phone: '9876543214', course: 'Mobile Development', batch: 'MD-2024-A', attendance: 90, status: 'active' }
    ]);
    setLoading(false);
  }, []);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Add Student
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{student.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{student.course}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{student.batch}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${student.attendance}%` }}
                        />
                      </div>
                      <span className="text-sm">{student.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
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
