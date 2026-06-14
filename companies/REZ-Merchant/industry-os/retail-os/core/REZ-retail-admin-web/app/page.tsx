"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Star,
  AlertTriangle,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: ShoppingCart, label: "POS", active: false },
  { icon: Package, label: "Inventory", active: false },
  { icon: Users, label: "Customers", active: false },
  { icon: Star, label: "Loyalty", active: false },
  { icon: CreditCard, label: "Billing", active: false },
  { icon: BarChart3, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Today's Sales", value: "₹45,230", change: "+12%", trend: "up", icon: DollarSign, color: "text-purple-600" },
  { label: "Orders", value: "156", change: "+8%", trend: "up", icon: ShoppingBag, color: "text-blue-600" },
  { label: "Customers", value: "89", change: "+15%", trend: "up", icon: Users, color: "text-green-600" },
  { label: "Low Stock", value: "12", change: "-3", trend: "down", icon: AlertTriangle, color: "text-red-600" },
];

const salesData = [
  { name: "Mon", sales: 35000, orders: 120 },
  { name: "Tue", sales: 42000, orders: 145 },
  { name: "Wed", sales: 38000, orders: 130 },
  { name: "Thu", sales: 45000, orders: 155 },
  { name: "Fri", sales: 52000, orders: 180 },
  { name: "Sat", sales: 48000, orders: 165 },
  { name: "Sun", sales: 35000, orders: 120 },
];

const categoryData = [
  { name: "Electronics", value: 35, color: "#a855f7" },
  { name: "Clothing", value: 25, color: "#3b82f6" },
  { name: "Home", value: 20, color: "#22c55e" },
  { name: "Beauty", value: 12, color: "#f59e0b" },
  { name: "Other", value: 8, color: "#6b7280" },
];

const topProducts = [
  { name: "iPhone 15 Pro", sku: "ELE001", stock: 45, price: "₹1,29,900", sold: 28 },
  { name: "Samsung TV 55\"", sku: "ELE002", stock: 12, price: "₹54,990", sold: 15 },
  { name: "Nike Air Max", sku: "CLO001", stock: 85, price: "₹8,495", sold: 42 },
  { name: "Levi's Jeans", sku: "CLO002", stock: 120, price: "₹3,299", sold: 38 },
];

const recentOrders = [
  { id: "ORD001", customer: "Rahul Sharma", items: 3, amount: "₹2,450", status: "completed", time: "10 min ago" },
  { id: "ORD002", customer: "Priya Patel", items: 5, amount: "₹8,990", status: "completed", time: "25 min ago" },
  { id: "ORD003", customer: "Amit Singh", items: 2, amount: "₹1,299", status: "processing", time: "1 hr ago" },
  { id: "ORD004", customer: "Sneha Gupta", items: 4, amount: "₹5,499", status: "completed", time: "2 hrs ago" },
];

const loyaltyMembers = [
  { name: "Rahul Sharma", points: 15420, tier: "Platinum", purchases: 45 },
  { name: "Priya Patel", points: 8950, tier: "Gold", purchases: 28 },
  { name: "Amit Singh", points: 4200, tier: "Silver", purchases: 15 },
  { name: "Sneha Gupta", points: 1850, tier: "Bronze", purchases: 8 },
];

export default function RetailAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-600">
          <span className="text-white font-bold text-xl">REZ Retail</span>
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
            <span className="text-sm text-gray-500">Retail Store Management</span>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorRetail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sales" stroke="#a855f7" fillOpacity={1} fill="url(#colorRetail)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.map((item, index) => (
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
            {/* Top Products */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Products</h3>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku} • Stock: {product.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-600">{product.price}</p>
                      <p className="text-sm text-gray-500">{product.sold} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{order.customer}</p>
                      <p className="text-sm text-gray-500">{order.items} items • {order.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{order.amount}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === "completed" ? "bg-green-100 text-green-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Loyalty Members */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Loyalty Members</h3>
              <div className="space-y-4">
                {loyaltyMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.purchases} purchases</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-600">{member.points.toLocaleString()} pts</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        member.tier === "Platinum" ? "bg-purple-100 text-purple-600" :
                        member.tier === "Gold" ? "bg-yellow-100 text-yellow-600" :
                        member.tier === "Silver" ? "bg-gray-100 text-gray-600" :
                        "bg-orange-100 text-orange-600"
                      }`}>
                        {member.tier}
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