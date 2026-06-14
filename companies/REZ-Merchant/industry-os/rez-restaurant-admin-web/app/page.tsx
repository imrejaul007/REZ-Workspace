"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Utensils,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  ChefHat,
  Package,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: ShoppingCart, label: "Orders", active: false },
  { icon: Utensils, label: "Menu", active: false },
  { icon: Users, label: "Tables", active: false },
  { icon: Package, label: "Inventory", active: false },
  { icon: ChefHat, label: "Kitchen", active: false },
  { icon: CreditCard, label: "Billing", active: false },
  { icon: BarChart3, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Today's Revenue", value: "₹45,230", change: "+12%", trend: "up", icon: DollarSign, color: "text-orange-600" },
  { label: "Orders", value: "156", change: "+8%", trend: "up", icon: ShoppingCart, color: "text-blue-600" },
  { label: "Avg Order Time", value: "18 min", change: "-3 min", trend: "down", icon: Clock, color: "text-green-600" },
  { label: "Table Turnover", value: "4.2x", change: "+0.5x", trend: "up", icon: Utensils, color: "text-purple-600" },
];

const revenueData = [
  { name: "Mon", revenue: 35000, orders: 85 },
  { name: "Tue", revenue: 42000, orders: 95 },
  { name: "Wed", revenue: 38000, orders: 88 },
  { name: "Thu", revenue: 45000, orders: 102 },
  { name: "Fri", revenue: 55000, orders: 125 },
  { name: "Sat", revenue: 62000, orders: 142 },
  { name: "Sun", revenue: 48000, orders: 110 },
];

const categoryData = [
  { name: "Starters", value: 25, color: "#f97316" },
  { name: "Main Course", value: 35, color: "#ea580c" },
  { name: "Beverages", value: 20, color: "#3b82f6" },
  { name: "Desserts", value: 12, color: "#8b5cf6" },
  { name: "Specials", value: 8, color: "#22c55e" },
];

const recentOrders = [
  { id: "ORD001", table: "T5", items: "Butter Chicken, Naan, Dal Makhani", amount: "₹850", status: "preparing", time: "12 min ago" },
  { id: "ORD002", table: "T12", items: "Paneer Tikka, Raita, Rice", amount: "₹620", status: "ready", time: "8 min ago" },
  { id: "ORD003", table: "T3", items: "Biryani, Raita, Salan", amount: "₹450", status: "served", time: "5 min ago" },
  { id: "ORD004", table: "T8", items: "Pasta, Garlic Bread, Coke", amount: "₹380", status: "preparing", time: "3 min ago" },
];

const topDishes = [
  { name: "Butter Chicken", orders: 85, revenue: "₹21,250", rating: 4.8 },
  { name: "Paneer Tikka", orders: 72, revenue: "₹14,400", rating: 4.7 },
  { name: "Biryani", orders: 65, revenue: "₹13,000", rating: 4.9 },
  { name: "Garlic Naan", orders: 120, revenue: "₹9,600", rating: 4.6 },
];

const kitchenQueue = [
  { orderId: "ORD001", items: "Butter Chicken, Naan", progress: 75, time: "12 min" },
  { orderId: "ORD004", items: "Pasta, Garlic Bread", progress: 45, time: "8 min" },
  { orderId: "ORD005", items: "Biryani, Raita", progress: 90, time: "5 min" },
];

export default function RestaurantAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-600">
          <span className="text-white font-bold text-xl">REZ Restaurant</span>
        </div>
        <nav className="flex-1 py-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors ${
                item.active ? "bg-orange-50 text-orange-600 border-r-4 border-orange-600" : ""
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 border-t border-gray-200 text-gray-500 hover:text-orange-600">
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <span className="text-sm text-gray-500">Restaurant Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search orders..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-orange-600">
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
                  <div className={`p-3 rounded-lg bg-orange-50 ${stat.color}`}>
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
                      <linearGradient id="colorRestaurant" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#f97316" fillOpacity={1} fill="url(#colorRestaurant)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Mix</h3>
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
            {/* Recent Orders */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">Table {order.table} • {order.id}</p>
                      <p className="text-sm text-gray-500">{order.items}</p>
                      <p className="text-xs text-gray-400 mt-1">{order.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{order.amount}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === "served" ? "bg-green-100 text-green-600" :
                        order.status === "ready" ? "bg-blue-100 text-blue-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Dishes */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Dishes</h3>
              <div className="space-y-4">
                {topDishes.map((dish, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{dish.name}</p>
                        <p className="text-sm text-gray-500">{dish.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">{dish.revenue}</p>
                      <p className="text-xs text-yellow-500">★ {dish.rating}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kitchen Queue */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ChefHat className="text-orange-600" size={20} />
                Kitchen Queue
              </h3>
              <div className="space-y-4">
                {kitchenQueue.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-800">{item.orderId}</p>
                      <p className="text-sm text-gray-500">{item.time}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.items}</p>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      ></div>
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