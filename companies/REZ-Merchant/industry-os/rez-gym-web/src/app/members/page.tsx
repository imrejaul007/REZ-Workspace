'use client';

import { useState, useEffect } from 'react';

interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: string;
  status: string;
  memberSince: string;
  totalVisits: number;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulated data
    setMembers([
      { id: '1', name: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul@example.com', tier: 'premium', status: 'active', memberSince: '2023-06-15', totalVisits: 85 },
      { id: '2', name: 'Priya Patel', phone: '+91 98765 43211', email: 'priya@example.com', tier: 'vip', status: 'active', memberSince: '2023-01-10', totalVisits: 156 },
      { id: '3', name: 'Amit Kumar', phone: '+91 98765 43212', email: 'amit@example.com', tier: 'basic', status: 'active', memberSince: '2023-09-20', totalVisits: 42 },
      { id: '4', name: 'Sneha Gupta', phone: '+91 98765 43213', email: 'sneha@example.com', tier: 'standard', status: 'frozen', memberSince: '2023-03-05', totalVisits: 65 },
      { id: '5', name: 'Vikram Singh', phone: '+91 98765 43214', email: 'vikram@example.com', tier: 'premium', status: 'active', memberSince: '2023-08-12', totalVisits: 95 },
    ]);
    setLoading(false);
  }, []);

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'frozen': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-gray-100 text-gray-800',
      standard: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      vip: 'bg-yellow-100 text-yellow-800',
    };
    return colors[tier] || 'bg-gray-100';
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Members</h1>
            <a href="/" className="text-blue-600 hover:text-blue-800">Back to Dashboard</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">💪</div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.phone}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getTierBadge(member.tier)}`}>
                  {member.tier.toUpperCase()}
                </span>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(member.status)}`}>
                    {member.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Member Since:</span>
                  <span className="text-gray-900">{member.memberSince}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Visits:</span>
                  <span className="text-gray-900 font-medium">{member.totalVisits}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  View Profile
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
                  Attendance
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
