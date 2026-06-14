"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  CreditCard,
  MapPin,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  UserPlus,
  CheckCircle,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Calendar, label: "Events", active: false },
  { icon: Ticket, label: "Tickets", active: false },
  { icon: Users, label: "Attendees", active: false },
  { icon: MapPin, label: "Venues", active: false },
  { icon: CreditCard, label: "Payments", active: false },
  { icon: BarChart3, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Active Events", value: "12", change: "+3", trend: "up", icon: Calendar, color: "text-fuchsia-600" },
  { label: "Tickets Sold", value: "2,450", change: "+18%", trend: "up", icon: Ticket, color: "text-purple-600" },
  { label: "Revenue", value: "₹8.5L", change: "+25%", trend: "up", icon: DollarSign, color: "text-green-600" },
  { label: "New Registrations", value: "485", change: "+12%", trend: "up", icon: UserPlus, color: "text-blue-600" },
];

const salesData = [
  { name: "Mon", tickets: 320, revenue: 45000 },
  { name: "Tue", tickets: 450, revenue: 62000 },
  { name: "Wed", tickets: 380, revenue: 52000 },
  { name: "Thu", tickets: 520, revenue: 72000 },
  { name: "Fri", tickets: 680, revenue: 95000 },
  { name: "Sat", tickets: 850, revenue: 120000 },
  { name: "Sun", tickets: 550, revenue: 78000 },
];

const eventTypeData = [
  { name: "Conferences", value: 30, color: "#d946ef" },
  { name: "Concerts", value: 25, color: "#8b5cf6" },
  { name: "Workshops", value: 20, color: "#3b82f6" },
  { name: "Meetups", value: 15, color: "#22c55e" },
  { name: "Other", value: 10, color: "#f59e0b" },
];

const upcomingEvents = [
  { name: "Tech Conference 2026", date: "June 15", venue: "Grand Hall", tickets: "450/500", status: "selling" },
  { name: "Music Festival", date: "June 20", venue: "Open Arena", tickets: "1200/1500", status: "selling" },
  { name: "Startup Meetup", date: "June 22", venue: "Tech Hub", tickets: "85/100", status: "filling" },
  { name: "Art Exhibition", date: "June 25", venue: "Gallery Center", tickets: "180/200", status: "selling" },
];

const recentBookings = [
  { id: "BK001", attendee: "Rahul Sharma", event: "Tech Conference", amount: "₹2,500", status: "confirmed", time: "10 min ago" },
  { id: "BK002", attendee: "Priya Patel", event: "Music Festival", amount: "₹1,800", status: "confirmed", time: "25 min ago" },
  { id: "BK003", attendee: "Amit Singh", event: "Startup Meetup", amount: "₹500", status: "pending", time: "1 hr ago" },
  { id: "BK004", attendee: "Sneha Gupta", event: "Art Exhibition", amount: "₹800", status: "confirmed", time: "2 hrs ago" },
];

const topAttendees = [
  { name: "Rahul Sharma", events: 8, spent: "₹15,000", status: "VIP" },
  { name: "Priya Patel", events: 6, spent: "₹12,000", status: "Premium" },
  { name: "Amit Singh", events: 5, spent: "₹9,500", status: "Premium" },
  { name: "Sneha Gupta", events: 4, spent: "₹7,200", status: "Regular" },
];

export default function EventsAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-fuchsia-500 to-purple-600">
          <span className="text-white font-bold text-xl">REZ Events</span>
        </div>
        <nav className="flex-1 py-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-fuchsia-50 hover:text-fuchsia-600 transition-colors ${
                item.active ? "bg-fuchsia-50 text-fuchsia-600 border-r-4 border-fuchsia-600" : ""
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 border-t border-gray-200 text-gray-500 hover:text-fuchsia-600">
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <span className="text-sm text-gray-500">Events Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search events..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-fuchsia-600">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-fuchsia-50 ${stat.color}`}>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Sales Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="tickets" stroke="#d946ef" fillOpacity={1} fill="url(#colorEvents)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Types</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={eventTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {eventTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {eventTypeData.map((item, index) => (
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
            {/* Upcoming Events */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Events</h3>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{event.name}</p>
                      <p className="text-sm text-gray-500">{event.date} • {event.venue}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        event.status === "selling" ? "bg-green-100 text-green-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {event.tickets}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Bookings</h3>
              <div className="space-y-4">
                {recentBookings.map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{booking.attendee}</p>
                      <p className="text-sm text-gray-500">{booking.event} • {booking.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{booking.amount}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === "confirmed" ? "bg-green-100 text-green-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Attendees */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Attendees</h3>
              <div className="space-y-4">
                {topAttendees.map((attendee, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-fuchsia-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {attendee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{attendee.name}</p>
                        <p className="text-sm text-gray-500">{attendee.events} events</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-fuchsia-600">{attendee.spent}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        attendee.status === "VIP" ? "bg-purple-100 text-purple-600" :
                        attendee.status === "Premium" ? "bg-blue-100 text-blue-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {attendee.status}
                      </span>
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