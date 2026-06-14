"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Scissors,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  DollarSign,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Clients", active: false },
  { icon: Calendar, label: "Appointments", active: false },
  { icon: Scissors, label: "Treatments", active: false },
  { icon: Package, label: "Inventory", active: false },
  { icon: CreditCard, label: "Payments", active: false },
  { icon: BarChart3, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Today's Revenue", value: "₹18,450", change: "+12%", trend: "up", icon: DollarSign, color: "text-pink-600" },
  { label: "Appointments", value: "24", change: "+8%", trend: "up", icon: Calendar, color: "text-purple-600" },
  { label: "New Clients", value: "6", change: "+15%", trend: "up", icon: UserPlus, color: "text-blue-600" },
  { label: "Avg Rating", value: "4.8", change: "+0.2", trend: "up", icon: Star, color: "text-yellow-500" },
];

const revenueData = [
  { name: "Mon", revenue: 12000, bookings: 18 },
  { name: "Tue", revenue: 15000, bookings: 22 },
  { name: "Wed", revenue: 18000, bookings: 28 },
  { name: "Thu", revenue: 22000, bookings: 32 },
  { name: "Fri", revenue: 28000, bookings: 40 },
  { name: "Sat", revenue: 35000, bookings: 48 },
  { name: "Sun", revenue: 32000, bookings: 45 },
];

const treatmentData = [
  { name: "Massage", value: 35, color: "#ec4899" },
  { name: "Facial", value: 25, color: "#8b5cf6" },
  { name: "Manicure", value: 20, color: "#3b82f6" },
  { name: "Pedicure", value: 12, color: "#10b981" },
  { name: "Other", value: 8, color: "#f59e0b" },
];

const upcomingAppointments = [
  { time: "10:00 AM", client: "Priya Sharma", treatment: "Aromatherapy Massage", duration: "60 min", status: "confirmed" },
  { time: "11:30 AM", client: "Anita Verma", treatment: "Classic Facial", duration: "45 min", status: "confirmed" },
  { time: "01:00 PM", client: "Meera Patel", treatment: "Hot Stone Massage", duration: "90 min", status: "pending" },
  { time: "02:30 PM", client: "Kavita Joshi", treatment: "Manicure & Pedicure", duration: "60 min", status: "confirmed" },
  { time: "04:00 PM", client: "Sunita Rao", treatment: "Deep Tissue Massage", duration: "75 min", status: "confirmed" },
];

const staffPerformance = [
  { name: "Priya", bookings: 45, revenue: 67500, rating: 4.9 },
  { name: "Anita", bookings: 42, revenue: 63000, rating: 4.8 },
  { name: "Meera", bookings: 38, revenue: 57000, rating: 4.7 },
  { name: "Kavita", bookings: 35, revenue: 52500, rating: 4.6 },
];

const recentPayments = [
  { id: "TXN001", client: "Priya Sharma", amount: "₹2,500", method: "UPI", status: "success", time: "09:30 AM" },
  { id: "TXN002", client: "Anita Verma", amount: "₹1,800", method: "Card", status: "success", time: "10:15 AM" },
  { id: "TXN003", client: "Meera Patel", amount: "₹3,500", method: "Cash", status: "success", time: "11:00 AM" },
  { id: "TXN004", client: "Kavita Joshi", amount: "₹1,200", method: "UPI", status: "pending", time: "11:45 AM" },
];

export default function SpaAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-pink-500 to-purple-600">
          <span className="text-white font-bold text-xl">REZ Spa</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors ${
                item.active ? "bg-pink-50 text-pink-600 border-r-4 border-pink-600" : ""
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-gray-200 text-gray-500 hover:text-pink-600 transition-colors"
        >
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <span className="text-sm text-gray-500">Welcome back, Admin</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-pink-600">
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
                  <div className={`p-3 rounded-lg bg-pink-50 ${stat.color}`}>
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
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                    <Bar dataKey="revenue" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Treatment Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Treatments</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={treatmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {treatmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {treatmentData.slice(0, 4).map((item, index) => (
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
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Upcoming Appointments</h3>
                <button className="text-sm text-pink-600 hover:text-pink-700 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {upcomingAppointments.map((apt, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {apt.client.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{apt.client}</p>
                      <p className="text-sm text-gray-500">{apt.treatment}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">{apt.time}</p>
                      <p className="text-xs text-gray-500">{apt.duration}</p>
                    </div>
                    <div>
                      {apt.status === "confirmed" ? (
                        <CheckCircle className="text-green-500" size={18} />
                      ) : (
                        <Clock className="text-yellow-500" size={18} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Performance */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Staff Performance</h3>
                <button className="text-sm text-pink-600 hover:text-pink-700 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {staffPerformance.map((staff, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {staff.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{staff.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{staff.bookings} bookings</span>
                        <span>•</span>
                        <span>₹{(staff.revenue / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-medium">{staff.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Payments</h3>
                <button className="text-sm text-pink-600 hover:text-pink-700 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {recentPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        payment.method === "UPI" ? "bg-green-100 text-green-600" :
                        payment.method === "Card" ? "bg-blue-100 text-blue-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        <CreditCard size={14} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{payment.client}</p>
                        <p className="text-xs text-gray-500">{payment.id} • {payment.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{payment.amount}</p>
                      {payment.status === "success" ? (
                        <span className="text-xs text-green-600 flex items-center gap-1 justify-end">
                          <CheckCircle size={12} /> Success
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
          </div>
        </div>
      </main>
    </div>
  );
}
