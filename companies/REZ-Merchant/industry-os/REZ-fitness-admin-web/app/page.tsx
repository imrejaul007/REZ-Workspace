"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Dumbbell,
  Users,
  CreditCard,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  UserPlus,
  Heart,
  Activity,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Members", active: false },
  { icon: Dumbbell, label: "Classes", active: false },
  { icon: Calendar, label: "Schedule", active: false },
  { icon: Heart, label: "Health", active: false },
  { icon: CreditCard, label: "Billing", active: false },
  { icon: BarChart3, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Active Members", value: "485", change: "+12%", trend: "up", icon: Users, color: "text-red-600" },
  { label: "Today's Check-ins", value: "156", change: "+8%", trend: "up", icon: Activity, color: "text-green-600" },
  { label: "Class Bookings", value: "42", change: "+15%", trend: "up", icon: Calendar, color: "text-blue-600" },
  { label: "Monthly Revenue", value: "₹4.5L", change: "+18%", trend: "up", icon: DollarSign, color: "text-purple-600" },
];

const attendanceData = [
  { name: "Mon", attendance: 180, revenue: 12000 },
  { name: "Tue", attendance: 195, revenue: 13500 },
  { name: "Wed", attendance: 188, revenue: 12800 },
  { name: "Thu", attendance: 210, revenue: 14500 },
  { name: "Fri", attendance: 245, revenue: 16800 },
  { name: "Sat", attendance: 280, revenue: 19200 },
  { name: "Sun", attendance: 156, revenue: 10800 },
];

const classData = [
  { name: "Yoga", value: 30, color: "#8b5cf6" },
  { name: "HIIT", value: 25, color: "#ef4444" },
  { name: "Cardio", value: 20, color: "#3b82f6" },
  { name: "Strength", value: 15, color: "#22c55e" },
  { name: "Dance", value: 10, color: "#f59e0b" },
];

const topMembers = [
  { name: "Rahul Sharma", memberId: "FIT001", checkins: 28, classes: 15, status: "active" },
  { name: "Priya Patel", memberId: "FIT002", checkins: 25, classes: 12, status: "active" },
  { name: "Amit Singh", memberId: "FIT003", checkins: 22, classes: 10, status: "active" },
  { name: "Sneha Gupta", memberId: "FIT004", checkins: 20, classes: 8, status: "expiring" },
];

const classSchedule = [
  { time: "06:00 AM", class: "Morning Yoga", trainer: "Priya", slots: "15/20", status: "available" },
  { time: "07:30 AM", class: "HIIT Blast", trainer: "Amit", slots: "18/20", status: "filling" },
  { time: "09:00 AM", class: "Cardio Dance", trainer: "Sneha", slots: "20/20", status: "full" },
  { time: "05:00 PM", class: "Strength Training", trainer: "Rahul", slots: "12/20", status: "available" },
  { time: "06:30 PM", class: "Evening Yoga", trainer: "Priya", slots: "16/20", status: "available" },
];

const recentPayments = [
  { member: "Rahul Sharma", amount: "₹3,500", type: "Monthly", date: "Today" },
  { member: "Priya Patel", amount: "₹8,500", type: "Quarterly", date: "Yesterday" },
  { member: "Amit Singh", amount: "₹25,000", type: "Annual", date: "2 days ago" },
  { member: "Sneha Gupta", amount: "₹3,500", type: "Monthly", date: "3 days ago" },
];

export default function FitnessAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-red-500 to-orange-600">
          <span className="text-white font-bold text-xl">REZ Fitness</span>
        </div>
        <nav className="flex-1 py-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors ${
                item.active ? "bg-red-50 text-red-600 border-r-4 border-red-600" : ""
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 border-t border-gray-200 text-gray-500 hover:text-red-600">
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <span className="text-sm text-gray-500">Fitness & Gym Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search members..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-red-600">
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
                  <div className={`p-3 rounded-lg bg-red-50 ${stat.color}`}>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData}>
                    <defs>
                      <linearGradient id="colorFitness" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="attendance" stroke="#ef4444" fillOpacity={1} fill="url(#colorFitness)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Class Mix</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={classData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {classData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {classData.map((item, index) => (
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
            {/* Top Members */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Members</h3>
              <div className="space-y-4">
                {topMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.checkins} check-ins</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      member.status === "active" ? "bg-green-100 text-green-600" :
                      "bg-yellow-100 text-yellow-600"
                    }`}>
                      {member.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Class Schedule */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Classes</h3>
              <div className="space-y-4">
                {classSchedule.map((cls, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-14 text-center">
                        <p className="font-semibold text-gray-800 text-sm">{cls.time}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{cls.class}</p>
                        <p className="text-sm text-gray-500">with {cls.trainer}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      cls.status === "full" ? "bg-red-100 text-red-600" :
                      cls.status === "filling" ? "bg-yellow-100 text-yellow-600" :
                      "bg-green-100 text-green-600"
                    }`}>
                      {cls.slots}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Payments</h3>
              <div className="space-y-4">
                {recentPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{payment.member}</p>
                      <p className="text-sm text-gray-500">{payment.type} • {payment.date}</p>
                    </div>
                    <p className="font-semibold text-red-600">{payment.amount}</p>
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