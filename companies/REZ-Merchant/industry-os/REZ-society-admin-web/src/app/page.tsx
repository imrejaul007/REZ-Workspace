'use client'
import { useState } from 'react'
import { Building, Users, CreditCard, AlertTriangle, CheckCircle, Calendar, Wrench, Bell } from 'lucide-react'

const stats = [
  { name: 'Total Flats', value: '200', change: '+10', icon: Building, color: 'blue' },
  { name: 'Residents', value: '450', change: '+25', icon: Users, color: 'green' },
  { name: 'Pending Bills', value: '₹2.5L', change: '-15%', icon: CreditCard, color: 'orange' },
  { name: 'Open Complaints', value: '8', change: '-3', icon: AlertTriangle, color: 'red' },
]

const visitors = [
  { id: 'V001', name: 'Ravi Kumar', flat: 'A-101', purpose: 'Delivery', time: '10:30 AM', status: 'checked_in' },
  { id: 'V002', name: 'Priya Singh', flat: 'B-205', purpose: 'Guest', time: '11:00 AM', status: 'waiting' },
  { id: 'V003', name: 'Service Man', flat: 'C-302', purpose: 'Maintenance', time: '9:15 AM', status: 'checked_out' },
]

const complaints = [
  { id: 'C001', flat: 'A-101', issue: 'Water leakage in bathroom', priority: 'high', status: 'open' },
  { id: 'C002', flat: 'B-205', issue: 'Lift not working', priority: 'urgent', status: 'in_progress' },
  { id: 'C003', flat: 'C-302', issue: 'Street light broken', priority: 'low', status: 'resolved' },
]

const announcements = [
  { id: 'A001', title: 'Society Meeting', date: 'June 15, 2026', type: 'meeting' },
  { id: 'A002', title: 'Maintenance Work', date: 'June 20, 2026', type: 'maintenance' },
]

export default function SocietyDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Society Management</h1>
          <p className="text-gray-500">Residential society operations</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Post Notice</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Resident</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <span className="text-green-600 text-sm font-medium">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-4">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Visitor Log</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {visitors.map((visitor) => (
              <div key={visitor.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{visitor.name}</p>
                    <p className="text-sm text-gray-500">{visitor.flat} • {visitor.purpose}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{visitor.time}</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    visitor.status === 'checked_in' ? 'bg-green-100 text-green-700' :
                    visitor.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {visitor.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Complaints</h3>
          </div>
          <div className="p-4 space-y-3">
            {complaints.map((comp) => (
              <div key={comp.id} className={`p-3 rounded-lg ${
                comp.priority === 'urgent' ? 'bg-red-50 border-l-4 border-red-500' :
                comp.priority === 'high' ? 'bg-orange-50 border-l-4 border-orange-500' :
                'bg-gray-50 border-l-4 border-gray-300'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{comp.flat}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    comp.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    comp.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {comp.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{comp.issue}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
          </div>
          <div className="p-4 space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-gray-900">{ann.title}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {ann.date}
                </p>
              </div>
            ))}
            <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600">
              + Add Announcement
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}