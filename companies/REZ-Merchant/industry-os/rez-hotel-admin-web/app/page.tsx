"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  CreditCard,
  Wrench,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Menu,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Building2, label: "Rooms", active: false },
  { icon: Users, label: "Guests", active: false },
  { icon: Calendar, label: "Bookings", active: false },
  { icon: CreditCard, label: "Billing", active: false },
  { icon: Wrench, label: "Housekeeping", active: false },
  { icon: Bell, label: "Alerts", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Total Rooms", value: "120", available: "45", icon: Home, color: "text-blue-600", bgColor: "bg-blue-50" },
  { label: "Check-ins Today", value: "18", change: "+3", icon: Users, color: "text-green-600", bgColor: "bg-green-50" },
  { label: "Revenue (Month)", value: "₹48.5L", change: "+12%", icon: CreditCard, color: "text-purple-600", bgColor: "bg-purple-50" },
  { label: "Pending Requests", value: "7", change: "-2", icon: Bell, color: "text-orange-600", bgColor: "bg-orange-50" },
];

const revenueData = [
  { name: "Mon", revenue: 1.2, occupancy: 65 },
  { name: "Tue", revenue: 1.5, occupancy: 72 },
  { name: "Wed", revenue: 1.3, occupancy: 68 },
  { name: "Thu", revenue: 1.8, occupancy: 78 },
  { name: "Fri", revenue: 2.2, occupancy: 85 },
  { name: "Sat", revenue: 2.5, occupancy: 92 },
  { name: "Sun", revenue: 2.0, occupancy: 82 },
];

const roomStatusData = [
  { status: "Occupied", count: 72, color: "#22c55e" },
  { status: "Available", count: 45, color: "#3b82f6" },
  { status: "Cleaning", count: 8, color: "#f59e0b" },
  { status: "Maintenance", count: 3, color: "#ef4444" },
];

const recentBookings = [
  { id: "BK001", guest: "Priya Sharma", room: "201", type: "Deluxe", checkIn: "Jun 8", checkOut: "Jun 10", status: "Checked In", amount: "₹8,500" },
  { id: "BK002", guest: "Amit Patel", room: "305", type: "Suite", checkIn: "Jun 8", checkOut: "Jun 12", status: "Checked In", amount: "₹18,000" },
  { id: "BK003", guest: "Neha Gupta", room: "412", type: "Standard", checkIn: "Jun 9", checkOut: "Jun 11", status: "Confirmed", amount: "₹6,000" },
  { id: "BK004", guest: "Vikram Singh", room: "501", type: "Suite", checkIn: "Jun 10", checkOut: "Jun 15", status: "Pending", amount: "₹25,000" },
];

const housekeepingTasks = [
  { room: "201", task: "Deep Cleaning", status: "In Progress", assigned: "Ramesh" },
  { room: "305", task: "Bed Change", status: "Completed", assigned: "Sunita" },
  { room: "412", task: "General Clean", status: "Pending", assigned: "Ramesh" },
  { room: "118", task: "Maintenance Check", status: "Pending", assigned: "Tek Chand" },
];

const topRooms = [
  { room: "501", type: "Suite", revenue: 45000, occupancy: "95%" },
  { room: "302", type: "Deluxe", revenue: 38000, occupancy: "92%" },
  { room: "201", type: "Deluxe", revenue: 35000, occupancy: "88%" },
  { room: "410", type: "Standard", revenue: 28000, occupancy: "85%" },
];

export default function HotelAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-700">
          <span className="text-white font-bold text-xl">REZ Hotel</span>
        </div>
        <nav className="flex-1 py-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveNav(item.label)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors ${
                activeNav === item.label ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-600" : ""
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-gray-200 text-gray-500 hover:text-emerald-600 flex items-center justify-center"
        >
          <Menu size={20} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <span className="text-sm text-gray-500">Hotel Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search bookings..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-emerald-600">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={stat.color} size={24} />
                  </div>
                  {stat.change && (
                    <span className={`flex items-center text-sm font-medium ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                      {stat.change.startsWith("+") ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {stat.change}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                <p className="text-sm text-gray-500">{stat.label}</p>
                {stat.available && (
                  <p className="text-xs text-emerald-600 mt-1">{stat.available} available</p>
                )}
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue & Occupancy</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (L)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Room Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Room Status</h3>
              <div className="space-y-4">
                {roomStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600">{item.status}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{item.count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Occupancy Rate</span>
                  <span className="font-semibold text-emerald-600">75%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Bookings */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Bookings</h3>
              <div className="space-y-4">
                {recentBookings.map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{booking.guest}</p>
                      <p className="text-sm text-gray-500">Room {booking.room} • {booking.type}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === "Checked In" ? "bg-green-100 text-green-600" :
                        booking.status === "Confirmed" ? "bg-blue-100 text-blue-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {booking.status}
                      </span>
                      <p className="text-sm font-medium text-gray-800 mt-1">{booking.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Housekeeping */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Housekeeping Tasks</h3>
              <div className="space-y-4">
                {housekeepingTasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      task.status === "Completed" ? "bg-green-100" :
                      task.status === "In Progress" ? "bg-yellow-100" :
                      "bg-gray-100"
                    }`}>
                      {task.status === "Completed" ? (
                        <CheckCircle className="text-green-600" size={18} />
                      ) : task.status === "In Progress" ? (
                        <Clock className="text-yellow-600" size={18} />
                      ) : (
                        <XCircle className="text-gray-400" size={18} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Room {task.room}</p>
                      <p className="text-sm text-gray-500">{task.task} • {task.assigned}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Rooms */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Rooms</h3>
              <div className="space-y-4">
                {topRooms.map((room, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                      {room.room}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Room {room.room}</p>
                      <p className="text-sm text-gray-500">{room.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-emerald-600">₹{(room.revenue / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-gray-500">{room.occupancy} occ</p>
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
