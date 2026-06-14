/**
 * Staff Web Dashboard
 * For: Front desk, Housekeeping, Kitchen, Manager
 */

'use client';

import React, { useState, useEffect } from 'react';

interface DashboardStats {
  todayCheckins: number;
  todayCheckouts: number;
  pendingRequests: number;
  occupiedRooms: number;
  availableRooms: number;
  housekeepingPending: number;
}

interface ServiceRequest {
  id: string;
  roomNumber: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed';
  time: string;
  notes?: string;
}

export default function StaffDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayCheckins: 12,
    todayCheckouts: 8,
    pendingRequests: 5,
    occupiedRooms: 45,
    availableRooms: 15,
    housekeepingPending: 3
  });

  const [requests, setRequests] = useState<ServiceRequest[]>([
    { id: '1', roomNumber: '101', type: 'Room Service', status: 'pending', time: '2 min ago' },
    { id: '2', roomNumber: '203', type: 'Housekeeping', status: 'pending', time: '5 min ago' },
    { id: '3', roomNumber: '305', type: 'Laundry', status: 'in_progress', time: '10 min ago' },
  ]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'rooms' | 'housekeeping'>('dashboard');

  const updateRequest = (id: string, status: ServiceRequest['status']) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Hotel Staff Dashboard</h1>
          <div className="flex gap-4 items-center">
            <span className="bg-blue-800 px-3 py-1 rounded text-sm">Front Desk</span>
            <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Check-ins', value: stats.todayCheckins, color: 'bg-green-500' },
            { label: 'Check-outs', value: stats.todayCheckouts, color: 'bg-orange-500' },
            { label: 'Pending', value: stats.pendingRequests, color: 'bg-yellow-500' },
            { label: 'Occupied', value: stats.occupiedRooms, color: 'bg-blue-500' },
            { label: 'Available', value: stats.availableRooms, color: 'bg-gray-500' },
            { label: 'HK Pending', value: stats.housekeepingPending, color: 'bg-purple-500' },
          ].map((stat, i) => (
            <div key={i} className={`${stat.color} text-white rounded-lg p-4 shadow-md`}>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex border-b bg-white rounded-t-lg">
          {(['dashboard', 'requests', 'rooms', 'housekeeping'] as const).map(tab => (
            <button
              key={tab}
              className={`px-6 py-3 capitalize font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
                  New Check-in
                </button>
                <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
                  New Check-out
                </button>
                <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
                  Room Service
                </button>
                <button className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors">
                  Maintenance
                </button>
              </div>
            </div>

            {/* Service Requests */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Service Requests</h2>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  {requests.filter(r => r.status === 'pending').length} pending
                </span>
              </div>
              {requests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                  <div>
                    <div className="font-bold">Room {request.roomNumber}</div>
                    <div className="text-gray-500 text-sm">{request.type} - {request.time}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {request.status.replace('_', ' ')}
                    </span>
                    {request.status === 'pending' && (
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                        onClick={() => updateRequest(request.id, 'in_progress')}
                      >
                        Start
                      </button>
                    )}
                    {request.status === 'in_progress' && (
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                        onClick={() => updateRequest(request.id, 'completed')}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">All Service Requests</h2>
            </div>
            <div className="divide-y">
              {requests.map(request => (
                <div key={request.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-lg">
                      {request.roomNumber}
                    </div>
                    <div>
                      <div className="font-bold">{request.type}</div>
                      <div className="text-gray-500 text-sm">{request.time}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        onClick={() => updateRequest(request.id, 'in_progress')}
                      >
                        Start
                      </button>
                    )}
                    {request.status === 'in_progress' && (
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                        onClick={() => updateRequest(request.id, 'completed')}
                      >
                        Complete
                      </button>
                    )}
                    {request.status === 'completed' && (
                      <span className="text-green-600 font-medium">Completed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Room Status</h2>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2">
              {Array.from({ length: 60 }, (_, i) => {
                const roomNum = (i + 101).toString();
                const isOccupied = i < 45;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-center font-medium ${
                      isOccupied ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {roomNum}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 bg-blue-100 rounded"></span> Occupied
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-100 rounded"></span> Available
              </span>
            </div>
          </div>
        )}

        {activeTab === 'housekeeping' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Housekeeping Tasks</h2>
            </div>
            <div className="divide-y">
              {[
                { room: '101', status: 'In Progress', type: 'Standard Cleaning' },
                { room: '203', status: 'Pending', type: 'Deep Cleaning' },
                { room: '305', status: 'Pending', type: 'Turndown Service' },
                { room: '412', status: 'Completed', type: 'Standard Cleaning' },
                { room: '508', status: 'Pending', type: 'Checkout Cleaning' },
              ].map((task, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold">Room {task.room}</div>
                    <div className="text-gray-500 text-sm">{task.type}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    task.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
