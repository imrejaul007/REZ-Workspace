"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Building,
  Users,
  Home,
  CreditCard,
  Wrench,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Building, label: "Wings", active: false },
  { icon: Users, label: "Residents", active: false },
  { icon: Home, label: "Units", active: false },
  { icon: Wrench, label: "Maintenance", active: false },
  { icon: CreditCard, label: "Payments", active: false },
  { icon: BarChart3, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Total Units", value: "240", change: "+12", trend: "up", icon: Home, color: "text-blue-600" },
  { label: "Occupied", value: "225", change: "+8", trend: "up", icon: Users, color: "text-green-600" },
  { label: "Maintenance", value: "18", change: "-3", trend: "down", icon: Wrench, color: "text-yellow-600" },
  { label: "Collection", value: "₹12.5L", change: "+15%", trend: "up", icon: DollarSign, color: "text-purple-600" },
];

const collectionData = [
  { name: "Jan", collected: 1000000, pending: 250000 },
  { name: "Feb", collected: 1100000, pending: 200000 },
  { name: "Mar", collected: 1200000, pending: 180000 },
  { name: "Apr", collected: 1150000, pending: 220000 },
  { name: "May", collected: 1250000, pending: 150000 },
  { name: "Jun", collected: 1300000, pending: 120000 },
];

const occupancyData = [
  { name: "Occupied", value: 94, color: "#22c55e" },
  { name: "Vacant", value: 4, color: "#f59e0b" },
  { name: "Maintenance", value: 2, color: "#ef4444" },
];

const recentComplaints = [
  { id: "MC001", issue: "Water supply interrupted", unit: "A-101", status: "open", priority: "high", raised: "2 hrs ago" },
  { id: "MC002", issue: "Lift not working", unit: "B-205", status: "in-progress", priority: "high", raised: "5 hrs ago" },
  { id: "MC003", issue: "Parking space dispute", unit: "C-302", status: "open", priority: "medium", raised: "1 day ago" },
  { id: "MC004", issue: "Common area light out", unit: "A-503", status: "resolved", priority: "low", raised: "2 days ago" },
];

const upcomingBills = [
  { title: "Quarterly Maintenance", amount: "₹4,500", dueDate: "15th June", units: 180 },
  { title: "Water Charges", amount: "₹1,200", dueDate: "20th June", units: 240 },
  { title: "Parking Fees", amount: "₹500", dueDate: "25th June", units: 85 },
];

const residentDirectory = [
  { name: "Rajesh Kumar", unit: "A-101", phone: "9876543210", type: "Owner" },
  { name: "Priya Patel", unit: "A-102", phone: "9876543211", type: "Tenant" },
  { name: "Amit Singh", unit: "B-201", phone: "9876543212", type: "Owner" },
  { name: "Sneha Gupta", unit: "B-202", phone: "9876543213", type: "Tenant" },
];

export default function SocietyAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
          <span className="text-white font-bold text-xl">REZ Society</span>
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
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 border-t border-gray-200 text-gray-500 hover:text-blue-600">
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <span className="text-sm text-gray-500">Society Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search residents..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-blue-600">
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Collection Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={collectionData}>
                    <defs>
                      <linearGradient id="colorSocietyCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="collected" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSocietyCollected)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Occupancy Status</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {occupancyData.map((item, index) => (
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
            {/* Maintenance Complaints */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Maintenance Issues</h3>
              <div className="space-y-4">
                {recentComplaints.map((complaint, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{complaint.issue}</p>
                      <p className="text-sm text-gray-500">{complaint.unit} • {complaint.raised}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      complaint.status === "resolved" ? "bg-green-100 text-green-600" :
                      complaint.status === "in-progress" ? "bg-yellow-100 text-yellow-600" :
                      "bg-red-100 text-red-600"
                    }`}>
                      {complaint.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Bills */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Bills</h3>
              <div className="space-y-4">
                {upcomingBills.map((bill, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{bill.title}</p>
                      <p className="text-sm text-gray-500">Due: {bill.dueDate} • {bill.units} units</p>
                    </div>
                    <p className="font-semibold text-blue-600">{bill.amount}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resident Directory */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resident Directory</h3>
              <div className="space-y-4">
                {residentDirectory.map((resident, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {resident.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{resident.name}</p>
                        <p className="text-sm text-gray-500">{resident.unit}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      resident.type === "Owner" ? "bg-green-100 text-green-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {resident.type}
                    </span>
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