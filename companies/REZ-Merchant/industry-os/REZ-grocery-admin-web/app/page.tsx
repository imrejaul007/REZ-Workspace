"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
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
  Clock,
  AlertTriangle,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: ShoppingCart, label: "Orders", active: false },
  { icon: Package, label: "Inventory", active: false },
  { icon: Truck, label: "Delivery", active: false },
  { icon: Users, label: "Customers", active: false },
  { icon: CreditCard, label: "Billing", active: false },
  { icon: BarChart3, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Today's Orders", value: "285", change: "+22%", trend: "up", icon: ShoppingCart, color: "text-green-600" },
  { label: "Revenue", value: "₹1.2L", change: "+18%", trend: "up", icon: DollarSign, color: "text-blue-600" },
  { label: "Pending Deliveries", value: "45", change: "+5", trend: "up", icon: Truck, color: "text-orange-600" },
  { label: "Out of Stock", value: "8", change: "-2", trend: "down", icon: AlertTriangle, color: "text-red-600" },
];

const salesData = [
  { name: "Mon", orders: 220, revenue: 85000 },
  { name: "Tue", orders: 250, revenue: 98000 },
  { name: "Wed", orders: 235, revenue: 92000 },
  { name: "Thu", orders: 280, revenue: 108000 },
  { name: "Fri", orders: 320, revenue: 125000 },
  { name: "Sat", orders: 285, revenue: 115000 },
  { name: "Sun", orders: 245, revenue: 95000 },
];

const categoryData = [
  { name: "Fruits & Veg", value: 30, color: "#22c55e" },
  { name: "Dairy", value: 20, color: "#3b82f6" },
  { name: "Bakery", value: 15, color: "#f59e0b" },
  { name: "Beverages", value: 15, color: "#8b5cf6" },
  { name: "Other", value: 20, color: "#6b7280" },
];

const topProducts = [
  { name: "Organic Bananas", sku: "GRC001", stock: 150, price: "₹45", sold: 85 },
  { name: "Fresh Milk 1L", sku: "GRC002", stock: 200, price: "₹60", sold: 120 },
  { name: "Brown Bread", sku: "GRC003", stock: 45, price: "₹35", sold: 65 },
  { name: "Green Tea", sku: "GRC004", stock: 120, price: "₹180", sold: 48 },
];

const recentOrders = [
  { id: "ORD001", customer: "Rahul Sharma", items: 12, amount: "₹450", status: "processing", time: "10 min ago" },
  { id: "ORD002", customer: "Priya Patel", items: 8, amount: "₹320", status: "out-for-delivery", time: "25 min ago" },
  { id: "ORD003", customer: "Amit Singh", items: 15, amount: "₹580", status: "delivered", time: "1 hr ago" },
  { id: "ORD004", customer: "Sneha Gupta", items: 6, amount: "₹280", status: "processing", time: "2 hrs ago" },
];

const deliverySchedule = [
  { time: "10:00 AM", address: "123 Main Street", customer: "Rahul Sharma", items: 12, status: "pending" },
  { time: "10:30 AM", address: "456 Oak Avenue", customer: "Priya Patel", items: 8, status: "pending" },
  { time: "11:00 AM", address: "789 Pine Road", customer: "Amit Singh", items: 15, status: "in-progress" },
  { time: "11:30 AM", address: "321 Elm Street", customer: "Sneha Gupta", items: 6, status: "pending" },
];

export default function GroceryAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600">
          <span className="text-white font-bold text-xl">REZ Grocery</span>
        </div>
        <nav className="flex-1 py-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors ${
                item.active ? "bg-green-50 text-green-600 border-r-4 border-green-600" : ""
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 border-t border-gray-200 text-gray-500 hover:text-green-600">
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <span className="text-sm text-gray-500">Grocery Store Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-green-600">
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
                  <div className={`p-3 rounded-lg bg-green-50 ${stat.color}`}>
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
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorGrocery" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="orders" stroke="#22c55e" fillOpacity={1} fill="url(#colorGrocery)" />
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
                      <p className="text-sm text-gray-500">Stock: {product.stock} • Sold: {product.sold}</p>
                    </div>
                    <p className="font-semibold text-green-600">{product.price}</p>
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
                        order.status === "delivered" ? "bg-green-100 text-green-600" :
                        order.status === "out-for-delivery" ? "bg-blue-100 text-blue-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {order.status.replace(/-/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Schedule */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Delivery Schedule</h3>
              <div className="space-y-4">
                {deliverySchedule.map((delivery, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-14 text-center">
                        <p className="font-semibold text-gray-800 text-sm">{delivery.time}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{delivery.customer}</p>
                        <p className="text-sm text-gray-500">{delivery.address}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      delivery.status === "in-progress" ? "bg-blue-100 text-blue-600" :
                      "bg-green-100 text-green-600"
                    }`}>
                      {delivery.status}
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