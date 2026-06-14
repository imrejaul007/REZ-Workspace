"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Droplets,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Truck,
  Shirt,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Droplets, label: "Orders", active: false },
  { icon: Shirt, label: "Services", active: false },
  { icon: Users, label: "Customers", active: false },
  { icon: Truck, label: "Pickup/Delivery", active: false },
  { icon: Package, label: "Inventory", active: false },
  { icon: CreditCard, label: "Billing", active: false },
  { icon: BarChart3, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Today's Orders", value: "85", change: "+12%", trend: "up", icon: Package, color: "text-blue-600" },
  { label: "Completed", value: "72", change: "+8%", trend: "up", icon: CheckCircle, color: "text-green-600" },
  { label: "Pending", value: "13", change: "-5", trend: "down", icon: Clock, color: "text-yellow-600" },
  { label: "Revenue", value: "₹28,500", change: "+15%", trend: "up", icon: CreditCard, color: "text-purple-600" },
];

const orderData = [
  { name: "Mon", orders: 65, revenue: 22000 },
  { name: "Tue", orders: 72, revenue: 25000 },
  { name: "Wed", orders: 68, revenue: 23000 },
  { name: "Thu", orders: 80, revenue: 28000 },
  { name: "Fri", orders: 95, revenue: 32000 },
  { name: "Sat", orders: 85, revenue: 28500 },
];

const serviceData = [
  { name: "Wash & Fold", value: 40, color: "#3b82f6" },
  { name: "Dry Clean", value: 30, color: "#8b5cf6" },
  { name: "Ironing", value: 20, color: "#22c55e" },
  { name: "Express", value: 10, color: "#f59e0b" },
];

const recentOrders = [
  { id: "LD001", customer: "Rahul Sharma", service: "Dry Clean", items: "3 shirts, 2 pants", amount: "₹850", status: "in-progress", time: "2 hrs" },
  { id: "LD002", customer: "Priya Patel", service: "Wash & Fold", items: "5 kg", amount: "₹350", status: "ready", time: "1 hr" },
  { id: "LD003", customer: "Amit Singh", service: "Express", items: "2 shirts", amount: "₹200", status: "delivered", time: "Done" },
  { id: "LD004", customer: "Sneha Gupta", service: "Dry Clean", items: "1 suit", amount: "₹450", status: "pending", time: "3 hrs" },
];

const pickupSchedule = [
  { time: "09:00 AM", address: "123 Main Street", customer: "Rahul Sharma", status: "completed" },
  { time: "10:30 AM", address: "456 Oak Avenue", customer: "Priya Patel", status: "in-progress" },
  { time: "11:30 AM", address: "789 Pine Road", customer: "Amit Singh", status: "pending" },
  { time: "01:00 PM", address: "321 Elm Street", customer: "Sneha Gupta", status: "pending" },
];

export default function LaundryAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-blue-500 to-cyan-600">
          <span className="text-white font-bold text-xl">REZ Laundry</span>
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
            <span className="text-sm text-gray-500">Laundry Operations</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search orders..."
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Orders Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={orderData}>
                    <defs>
                      <linearGradient id="colorLaundryOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="orders" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLaundryOrders)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Mix</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={serviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {serviceData.map((item, index) => (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{order.customer}</p>
                      <p className="text-sm text-gray-500">{order.service} • {order.items}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{order.amount}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === "delivered" ? "bg-green-100 text-green-600" :
                        order.status === "ready" ? "bg-blue-100 text-blue-600" :
                        order.status === "in-progress" ? "bg-yellow-100 text-yellow-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pickup Schedule */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Pickups</h3>
              <div className="space-y-4">
                {pickupSchedule.map((pickup, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center">
                        <p className="font-semibold text-gray-800">{pickup.time}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{pickup.customer}</p>
                        <p className="text-sm text-gray-500">{pickup.address}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pickup.status === "completed" ? "bg-green-100 text-green-600" :
                      pickup.status === "in-progress" ? "bg-yellow-100 text-yellow-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {pickup.status}
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