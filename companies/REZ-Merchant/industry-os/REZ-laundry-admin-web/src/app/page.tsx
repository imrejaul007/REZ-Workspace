'use client'
import { useState } from 'react'
import { Shirt, Droplet, Truck, Clock, CheckCircle, AlertCircle, DollarSign, Users } from 'lucide-react'

const stats = [
  { name: 'Total Orders', value: '456', change: '+12%', icon: Shirt, color: 'blue' },
  { name: 'In Progress', value: '34', change: '+5', icon: Droplet, color: 'yellow' },
  { name: 'Delivered Today', value: '89', change: '+15', icon: Truck, color: 'green' },
  { name: 'Revenue', value: '₹1.2L', change: '+18%', icon: DollarSign, color: 'purple' },
]

const orders = [
  { id: 'LD001', customer: 'Rahul Sharma', items: 5, status: 'washing', time: '45 min', price: '₹350' },
  { id: 'LD002', customer: 'Priya Patel', items: 3, status: 'ready', time: 'Done', price: '₹220' },
  { id: 'LD003', customer: 'Amit Kumar', items: 8, status: 'pickup', time: '10:30 AM', price: '₹580' },
  { id: 'LD004', customer: 'Sneha Gupta', items: 4, status: 'delivered', time: 'Yesterday', price: '₹290' },
]

const machines = [
  { id: 'M1', name: 'Washer 1', status: 'running', load: 75, time: '25 min' },
  { id: 'M2', name: 'Washer 2', status: 'idle', load: 0, time: '-' },
  { id: 'M3', name: 'Dryer 1', status: 'running', load: 60, time: '15 min' },
  { id: 'M4', name: 'Dryer 2', status: 'maintenance', load: 0, time: '-' },
]

export default function LaundryDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laundry Management</h1>
          <p className="text-gray-500">Manage orders, machines & deliveries</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">New Order</button>
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
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shirt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.customer}</p>
                    <p className="text-sm text-gray-500">{order.items} items • {order.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'ready' ? 'bg-green-100 text-green-700' :
                    order.status === 'washing' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'pickup' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status}
                  </span>
                  <span className="text-sm text-gray-500">{order.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Machine Status</h3>
          </div>
          <div className="p-4 space-y-3">
            {machines.map((machine) => (
              <div key={machine.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{machine.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    machine.status === 'running' ? 'bg-green-100 text-green-700' :
                    machine.status === 'idle' ? 'bg-gray-200 text-gray-600' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {machine.status}
                  </span>
                </div>
                {machine.status === 'running' && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${machine.load}%` }} />
                    </div>
                    <span className="text-sm text-gray-500">{machine.load}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}