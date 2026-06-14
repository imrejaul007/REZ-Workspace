'use client'

import { useState } from 'react'
import { Truck, MapPin, Fuel, Wrench, AlertTriangle, CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react'

const stats = [
  { name: 'Total Vehicles', value: '45', change: '+3', icon: Truck, color: 'blue' },
  { name: 'Active Trips', value: '28', change: '+5', icon: MapPin, color: 'green' },
  { name: 'Maintenance Due', value: '8', change: '-2', icon: Wrench, color: 'orange' },
  { name: 'Fuel Efficiency', value: '85%', change: '+7%', icon: Fuel, color: 'purple' },
]

const vehicles = [
  { id: 'VH001', plate: 'DL 01 AB 1234', type: 'Truck', driver: 'Ramesh Kumar', status: 'active', location: 'Delhi NCR', fuel: 75 },
  { id: 'VH002', plate: 'DL 01 CD 5678', type: 'Van', driver: 'Suresh Singh', status: 'active', location: 'Gurgaon', fuel: 45 },
  { id: 'VH003', plate: 'DL 01 EF 9012', type: 'Truck', driver: 'Vikram Patel', status: 'maintenance', location: 'Service Center', fuel: 20 },
  { id: 'VH004', plate: 'MH 12 GH 3456', type: 'Truck', driver: 'Ajay Sharma', status: 'active', location: 'Mumbai', fuel: 90 },
]

const alerts = [
  { id: 1, type: 'fuel', message: 'VH002 fuel level below 50%', severity: 'warning' },
  { id: 2, type: 'maintenance', message: 'VH003 maintenance overdue by 2 days', severity: 'urgent' },
  { id: 3, type: 'speed', message: 'VH001 exceeded speed limit on NH-8', severity: 'info' },
]

const drivers = [
  { id: 'DR001', name: 'Ramesh Kumar', phone: '+91 98765 43210', trips: 156, rating: 4.8, status: 'available' },
  { id: 'DR002', name: 'Suresh Singh', phone: '+91 98765 43211', trips: 203, rating: 4.6, status: 'on_trip' },
  { id: 'DR003', name: 'Vikram Patel', phone: '+91 98765 43212', trips: 89, rating: 4.9, status: 'off_duty' },
  { id: 'DR004', name: 'Ajay Sharma', phone: '+91 98765 43213', trips: 178, rating: 4.7, status: 'on_trip' },
]

export default function FleetDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-500">Track vehicles, drivers & optimize routes</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Add Vehicle
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Assign Trip
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${
                stat.color === 'blue' ? 'bg-blue-100' :
                stat.color === 'green' ? 'bg-green-100' :
                stat.color === 'orange' ? 'bg-orange-100' : 'bg-purple-100'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'orange' ? 'text-orange-600' : 'text-purple-600'
                }`} />
              </div>
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-4">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium capitalize ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicles */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Fleet Vehicles</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {vehicles.map((v) => (
              <div key={v.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{v.plate}</p>
                    <p className="text-sm text-gray-500">{v.type} • {v.driver}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{v.location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: `${v.fuel}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{v.fuel}%</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {v.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
          </div>
          <div className="p-4 space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg ${
                alert.severity === 'urgent' ? 'bg-red-50 border-l-4 border-red-500' :
                alert.severity === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                'bg-blue-50 border-l-4 border-blue-500'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    alert.severity === 'urgent' ? 'text-red-500' :
                    alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <span className="font-medium text-sm">{alert.type}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drivers */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Driver Performance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {drivers.map((driver) => (
            <div key={driver.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{driver.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  driver.status === 'available' ? 'bg-green-100 text-green-700' :
                  driver.status === 'on_trip' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {driver.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{driver.phone}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">⭐ {driver.rating}</span>
                <span className="text-sm text-gray-500">{driver.trips} trips</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}