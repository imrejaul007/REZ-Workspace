'use client'

import { useState } from 'react'
import {
  Plane,
  Hotel,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  MoreVertical,
  ChevronRight,
  Star,
  Clock,
  Globe,
  Briefcase
} from 'lucide-react'

// Mock data
const stats = [
  { name: 'Total Bookings', value: '2,847', change: '+12%', icon: Calendar, color: 'blue' },
  { name: 'Revenue', value: '₹45.2L', change: '+18%', icon: DollarSign, color: 'green' },
  { name: 'Active Trips', value: '156', change: '+8%', icon: Plane, color: 'purple' },
  { name: 'Happy Travelers', value: '98%', change: '+2%', icon: Star, color: 'yellow' },
]

const recentBookings = [
  { id: 1, customer: 'Rahul Sharma', destination: 'Goa', date: 'Jun 15-18', status: 'confirmed', amount: '₹24,500' },
  { id: 2, customer: 'Priya Patel', destination: 'Kerala', date: 'Jun 20-25', status: 'pending', amount: '₹42,000' },
  { id: 3, customer: 'Amit Kumar', destination: 'Manali', date: 'Jun 22-26', status: 'confirmed', amount: '₹18,900' },
  { id: 4, customer: 'Sneha Gupta', destination: 'Rajasthan', date: 'Jul 1-7', status: 'confirmed', amount: '₹56,000' },
]

const popularDestinations = [
  { name: 'Goa', bookings: 245, growth: '+15%', image: '🏖️' },
  { name: 'Kerala', bookings: 198, growth: '+22%', image: '🌴' },
  { name: 'Manali', bookings: 176, growth: '+8%', image: '🏔️' },
  { name: 'Rajasthan', bookings: 156, growth: '+31%', image: '🏰' },
  { name: 'Andaman', bookings: 134, growth: '+45%', image: '🏝️' },
]

const flights = [
  { id: 1, airline: 'IndiGo', from: 'DEL', to: 'GOX', departure: '6:00 AM', price: '₹4,500' },
  { id: 2, airline: 'Air India', from: 'DEL', to: 'GOX', departure: '9:30 AM', price: '₹5,200' },
  { id: 3, airline: 'SpiceJet', from: 'DEL', to: 'GOX', departure: '2:15 PM', price: '₹3,800' },
]

export default function TravelDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Travel Admin</h1>
          <p className="text-gray-500">Manage bookings, flights, hotels & experiences</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${
                stat.color === 'blue' ? 'bg-blue-100' :
                stat.color === 'green' ? 'bg-green-100' :
                stat.color === 'purple' ? 'bg-purple-100' : 'bg-yellow-100'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'purple' ? 'text-purple-600' : 'text-yellow-600'
                }`} />
              </div>
              <span className="text-green-600 text-sm font-medium">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-4">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {['dashboard', 'bookings', 'flights', 'hotels', 'packages'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              <button className="text-sm text-blue-600 hover:underline">View all</button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{booking.customer}</p>
                    <p className="text-sm text-gray-500">{booking.destination} • {booking.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-900">{booking.amount}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Destinations */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Popular Destinations</h3>
          </div>
          <div className="p-4 space-y-3">
            {popularDestinations.map((dest) => (
              <div key={dest.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{dest.image}</span>
                  <div>
                    <p className="font-medium text-gray-900">{dest.name}</p>
                    <p className="text-sm text-gray-500">{dest.bookings} bookings</p>
                  </div>
                </div>
                <span className="text-green-600 text-sm font-medium">{dest.growth}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 text-left">
          <Plane className="w-8 h-8 text-blue-600 mb-2" />
          <p className="font-medium text-gray-900">Add Flight</p>
          <p className="text-sm text-gray-500">Create new flight</p>
        </button>
        <button className="p-4 bg-green-50 rounded-xl hover:bg-green-100 text-left">
          <Hotel className="w-8 h-8 text-green-600 mb-2" />
          <p className="font-medium text-gray-900">Add Hotel</p>
          <p className="text-sm text-gray-500">List new property</p>
        </button>
        <button className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 text-left">
          <Briefcase className="w-8 h-8 text-purple-600 mb-2" />
          <p className="font-medium text-gray-900">Create Package</p>
          <p className="text-sm text-gray-500">Bundle deal</p>
        </button>
        <button className="p-4 bg-orange-50 rounded-xl hover:bg-orange-100 text-left">
          <Globe className="w-8 h-8 text-orange-600 mb-2" />
          <p className="font-medium text-gray-900">Add Destination</p>
          <p className="text-sm text-gray-500">New location</p>
        </button>
      </div>
    </div>
  )
}