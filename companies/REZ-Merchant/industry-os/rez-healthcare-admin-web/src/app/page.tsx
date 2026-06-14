'use client'

import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Mock data for charts
const patientData = [
  { month: 'Jan', patients: 245 },
  { month: 'Feb', patients: 312 },
  { month: 'Mar', patients: 298 },
  { month: 'Apr', patients: 356 },
  { month: 'May', patients: 412 },
  { month: 'Jun', patients: 478 },
]

const revenueData = [
  { month: 'Jan', revenue: 85000 },
  { month: 'Feb', revenue: 92000 },
  { month: 'Mar', revenue: 88000 },
  { month: 'Apr', revenue: 105000 },
  { month: 'May', revenue: 112000 },
  { month: 'Jun', revenue: 128000 },
]

const stats = [
  {
    name: 'Total Patients',
    value: '2,847',
    change: '+12%',
    changeType: 'positive',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    name: "Today's Appointments",
    value: '24',
    change: '+3',
    changeType: 'positive',
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    name: 'Monthly Revenue',
    value: '₹12.8L',
    change: '+18%',
    changeType: 'positive',
    icon: DollarSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    name: 'Critical Cases',
    value: '3',
    change: '-1',
    changeType: 'positive',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
]

const recentAppointments = [
  { id: 1, patient: 'Rahul Sharma', time: '9:00 AM', doctor: 'Dr. Gupta', status: 'completed' },
  { id: 2, patient: 'Priya Singh', time: '10:30 AM', doctor: 'Dr. Kumar', status: 'in-progress' },
  { id: 3, patient: 'Amit Patel', time: '11:00 AM', doctor: 'Dr. Gupta', status: 'waiting' },
  { id: 4, patient: 'Sneha Gupta', time: '12:00 PM', doctor: 'Dr. Singh', status: 'waiting' },
  { id: 5, patient: 'Vikram Mehta', time: '2:00 PM', doctor: 'Dr. Kumar', status: 'scheduled' },
]

const pendingTasks = [
  { id: 1, task: 'Review lab results for patient #4521', priority: 'high', time: 'Due 10 AM' },
  { id: 2, task: 'Update prescription for diabetes patient', priority: 'medium', time: 'Due 12 PM' },
  { id: 3, task: 'Schedule follow-up appointment', priority: 'low', time: 'Due 5 PM' },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, Dr. Sharma. Here's your overview.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + New Appointment
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.changeType === 'positive' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Trends */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Patient Trends</h3>
            <select className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
              <option>Last 6 months</option>
              <option>Last year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={patientData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trends */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            <select className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
              <option>Last 6 months</option>
              <option>Last year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
            <button className="text-sm text-blue-600 hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {recentAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    apt.status === 'completed' ? 'bg-green-500' :
                    apt.status === 'in-progress' ? 'bg-yellow-500' :
                    apt.status === 'waiting' ? 'bg-orange-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{apt.patient}</p>
                    <p className="text-sm text-gray-500">{apt.doctor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{apt.time}</p>
                  <p className="text-xs text-gray-500 capitalize">{apt.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Tasks</h3>
            <button className="text-sm text-blue-600 hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{task.task}</p>
                    <p className="text-sm text-gray-500">{task.time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Add Patient</p>
            </button>
            <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
              <Calendar className="w-6 h-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Book Appt</p>
            </button>
            <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
              <DollarSign className="w-6 h-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">New Invoice</p>
            </button>
            <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
              <Activity className="w-6 h-6 text-orange-600 mb-2" />
              <p className="font-medium text-gray-900">Lab Order</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}