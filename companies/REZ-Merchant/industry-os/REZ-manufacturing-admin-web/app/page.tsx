"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Factory,
  Package,
  Users,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Cog,
  BarChart3,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Factory, label: "Production", active: false },
  { icon: Package, label: "Inventory", active: false },
  { icon: Wrench, label: "Machines", active: false },
  { icon: Cog, label: "Operations", active: false },
  { icon: Users, label: "Workers", active: false },
  { icon: BarChart3, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Daily Output", value: "2,450 units", change: "+8%", trend: "up", icon: Factory, color: "text-purple-600" },
  { label: "Efficiency", value: "94%", change: "+2%", trend: "up", icon: Cog, color: "text-green-600" },
  { label: "Downtime", value: "2.5 hrs", change: "-15%", trend: "down", icon: AlertTriangle, color: "text-red-600" },
  { label: "Quality Rate", value: "99.2%", change: "+0.5%", trend: "up", icon: CheckCircle, color: "text-blue-600" },
];

const productionData = [
  { name: "Mon", output: 2200, target: 2000 },
  { name: "Tue", output: 2400, target: 2000 },
  { name: "Wed", output: 2350, target: 2000 },
  { name: "Thu", output: 2600, target: 2000 },
  { name: "Fri", output: 2800, target: 2000 },
  { name: "Sat", output: 2450, target: 2000 },
];

const machineData = [
  { name: "CNC Mill", status: 85, color: "#22c55e" },
  { name: "Lathe", status: 92, color: "#3b82f6" },
  { name: "Press", status: 78, color: "#f59e0b" },
  { name: "Welder", status: 95, color: "#22c55e" },
  { name: "Cutter", status: 65, color: "#ef4444" },
];

const recentOrders = [
  { id: "PO001", product: "Steel Brackets", quantity: 500, status: "in-progress", priority: "high" },
  { id: "PO002", product: "Aluminum Panels", quantity: 350, status: "completed", priority: "medium" },
  { id: "PO003", product: "Copper Pipes", quantity: 200, status: "pending", priority: "low" },
  { id: "PO004", product: "Plastic Covers", quantity: 800, status: "in-progress", priority: "high" },
];

const machineStatus = [
  { name: "CNC Mill #1", status: "running", efficiency: 92, nextMaintenance: "3 days" },
  { name: "CNC Mill #2", status: "idle", efficiency: 0, nextMaintenance: "5 days" },
  { name: "Lathe #1", status: "running", efficiency: 88, nextMaintenance: "7 days" },
  { name: "Press #1", status: "maintenance", efficiency: 0, nextMaintenance: "Today" },
];

export default function ManufacturingAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600">
          <span className="text-white font-bold text-xl">REZ Mfg</span>
        </div>
        <nav className="flex-1 py-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors ${
                item.active ? "bg-purple-50 text-purple-600 border-r-4 border-purple-600" : ""
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 border-t border-gray-200 text-gray-500 hover:text-purple-600">
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <span className="text-sm text-gray-500">Manufacturing Operations</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-purple-600">
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
                  <div className={`p-3 rounded-lg bg-purple-50 ${stat.color}`}>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Production Output</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={productionData}>
                    <defs>
                      <linearGradient id="colorMfgOutput" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="output" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMfgOutput)" />
                    <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Machine Efficiency</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={machineData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="status">
                      {machineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {machineData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-800">{item.status}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Production Orders</h3>
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{order.product}</p>
                      <p className="text-sm text-gray-500">Qty: {order.quantity} units</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.priority === "high" ? "bg-red-100 text-red-600" :
                        order.priority === "medium" ? "bg-yellow-100 text-yellow-600" :
                        "bg-green-100 text-green-600"
                      }`}>
                        {order.priority}
                      </span>
                      <p className="text-sm mt-1 text-gray-600">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Machine Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Machine Status</h3>
              <div className="space-y-4">
                {machineStatus.map((machine, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{machine.name}</p>
                      <p className="text-sm text-gray-500">Next maintenance: {machine.nextMaintenance}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        machine.status === "running" ? "bg-green-100 text-green-600" :
                        machine.status === "idle" ? "bg-yellow-100 text-yellow-600" :
                        "bg-red-100 text-red-600"
                      }`}>
                        {machine.status}
                      </span>
                      {machine.efficiency > 0 && (
                        <p className="text-sm mt-1 text-gray-600">{machine.efficiency}% efficiency</p>
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