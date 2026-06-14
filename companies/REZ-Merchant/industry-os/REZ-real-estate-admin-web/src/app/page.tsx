'use client'
import { useState } from 'react'
import { Building, Users, TrendingUp, DollarSign, MapPin, Calendar, Home, Eye } from 'lucide-react'

const stats = [
  { name: 'Total Properties', value: '45', change: '+5', icon: Building, color: 'blue' },
  { name: 'Active Leads', value: '128', change: '+23', icon: Users, color: 'green' },
  { name: 'Deals Closed', value: '12', change: '+3', icon: TrendingUp, color: 'purple' },
  { name: 'Revenue', value: '₹8.5Cr', change: '+18%', icon: DollarSign, color: 'orange' },
]

const properties = [
  { id: 'P001', name: 'Sunrise Apartments', type: 'Apartment', location: 'Gurgaon', price: '₹85L', status: 'available', views: 245 },
  { id: 'P002', name: 'Green Valley Villa', type: 'Villa', location: 'Dwarka', price: '₹1.5Cr', status: 'booked', views: 189 },
  { id: 'P003', name: 'Metro Heights', type: 'Apartment', location: 'Noida', price: '₹62L', status: 'available', views: 312 },
]

const leads = [
  { id: 'L001', name: 'Rahul Sharma', phone: '+91 98765 43210', interest: '2BHK in Gurgaon', budget: '₹80-90L', status: 'visit_scheduled' },
  { id: 'L002', name: 'Priya Patel', phone: '+91 98765 43211', interest: '3BHK in Dwarka', budget: '₹1.2-1.5Cr', status: 'negotiating' },
  { id: 'L003', name: 'Amit Kumar', phone: '+91 98765 43212', interest: '1BHK in Noida', budget: '₹50-60L', status: 'new' },
]

export default function RealEstateDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real Estate</h1>
          <p className="text-gray-500">Property management & sales pipeline</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Add Property</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">New Lead</button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {properties.map((prop) => (
              <div key={prop.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{prop.name}</p>
                    <p className="text-sm text-gray-500">{prop.type} • {prop.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{prop.price}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><Eye className="w-3 h-3" /> {prop.views}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <div key={lead.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{lead.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    lead.status === 'visit_scheduled' ? 'bg-blue-100 text-blue-700' :
                    lead.status === 'negotiating' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {lead.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">{lead.interest}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{lead.phone}</span>
                  <span className="text-green-600 font-medium">{lead.budget}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}