"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Plane,
  Building2,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserPlus,
  CheckCircle,
  Clock,
  MapPin,
  Globe,
  Ticket,
  Luggage,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Plane, label: "Flights", active: false },
  { icon: Building2, label: "Hotels", active: false },
  { icon: Users, label: "Guests", active: false },
  { icon: Calendar, label: "Bookings", active: false },
  { icon: MapPin, label: "Destinations", active: false },
  { icon: Ticket, label: "Packages", active: false },
  { icon: Luggage, label: "Inventory", active: false },
  { icon: CreditCard, label: "Payments", active: false },
  { icon: BarChart3, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Today's Revenue", value: "₹2,45,000", change: "+18%", trend: "up", icon: DollarSign, color: "text-blue-600" },
  { label: "Active Bookings", value: "124", change: "+12", trend: "up", icon: Calendar, color: "text-purple-600" },
  { label: "New Guests", value: "38", change: "+8", trend: "up", icon: UserPlus, color: "text-green-600" },
  { label: "Avg. Rating", value: "4.7", change: "+0.2", trend: "up", icon: Globe, color: "text-yellow-500" },
];

const revenueData = [
  { name: "Mon", revenue: 180000, bookings: 45 },
  { name: "Tue", revenue: 220000, bookings: 52 },
  { name: "Wed", revenue: 195000, bookings: 48 },
  { name: "Thu", revenue: 250000, bookings: 58 },
  { name: "Fri", revenue: 320000, bookings: 72 },
  { name: "Sat", revenue: 380000, bookings: 85 },
  { name: "Sun", revenue: 340000, bookings: 78 },
];

const destinationData = [
  { name: "Goa", bookings: 85, revenue: 1250000 },
  { name: "Manali", bookings: 72, revenue: 1080000 },
  { name: "Kerala", bookings: 68, revenue: 1020000 },
  { name: "Jaipur", bookings: 55, revenue: 825000 },
  { name: "Kashmir", bookings: 48, revenue: 960000 },
];

const typeData = [
  { name: "Flights", value: 40, color: "#3b82f6" },
  { name: "Hotels", value: 35, color: "#8b5cf6" },
  { name: "Packages", value: 15, color: "#22c55e" },
  { name: "Activities", value: 10, color: "#f59e0b" },
];

const recentBookings = [
  { id: "BK001", guest: "Rahul Sharma", destination: "Goa", type: "Package", amount: "₹45,000", status: "confirmed", date: "Today" },
  { id: "BK002", guest: "Priya Patel", destination: "Manali", type: "Hotel", amount: "₹28,000", status: "pending", date: "Today" },
  { id: "BK003", guest: "Amit Singh", destination: "Kerala", type: "Flight + Hotel", amount: "₹52,000", status: "confirmed", date: "Today" },
  { id: "BK004", guest: "Sneha Gupta", destination: "Jaipur", type: "Package", amount: "₹35,000", status: "confirmed", date: "Yesterday" },
];

const topAgents = [
  { name: "TravelWorld", bookings: 156, revenue: "₹45L", rating: 4.9 },
  { name: "GoaEscapes", bookings: 142, revenue: "₹38L", rating: 4.8 },
  { name: "HimalayanTours", bookings: 128, revenue: "₹32L", rating: 4.7 },
  { name: "KeralaStay", bookings: 115, revenue: "₹28L", rating: 4.6 },
];

export default function TravelAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
          <span className="text-white font-bold text-xl">REZ Travel</span>
        </div>
        <nav className="flex-1 py-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                item.active ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600" : ""
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-gray-200 text-gray-500 hover:text-blue-600 transition-colors"
        >
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <span className="text-sm text-gray-500">Welcome back, Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search destinations..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-blue-600">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-blue-50 ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <span className={`flex items-center text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {stat.trend === "up" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorTravelRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTravelRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Types</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {typeData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-800">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Destinations */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Destinations</h3>
              <div className="space-y-4">
                {destinationData.map((dest, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{dest.name}</p>
                      <p className="text-sm text-gray-500">{dest.bookings} bookings</p>
                    </div>
                    <p className="font-semibold text-blue-600">₹{(dest.revenue / 100000).toFixed(1)}L</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Bookings</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {recentBookings.map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{booking.guest}</p>
                      <p className="text-sm text-gray-500">{booking.destination} • {booking.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{booking.amount}</p>
                      {booking.status === "confirmed" ? (
                        <span className="text-xs text-green-600 flex items-center gap-1 justify-end">
                          <CheckCircle size={12} /> Confirmed
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600 flex items-center gap-1 justify-end">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Agents */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Travel Agents</h3>
              <div className="space-y-4">
                {topAgents.map((agent, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {agent.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{agent.name}</p>
                      <p className="text-sm text-gray-500">{agent.bookings} bookings</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">{agent.revenue}</p>
                      <p className="text-xs text-yellow-500">★ {agent.rating}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}