"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Pill,
  Users,
  FileText,
  Package,
  CreditCard,
  AlertTriangle,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Thermometer,
  Activity,
  Beaker,
  Truck,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Pill, label: "Medicines", active: false },
  { icon: FileText, label: "Prescriptions", active: false },
  { icon: Users, label: "Customers", active: false },
  { icon: Package, label: "Inventory", active: false },
  { icon: Truck, label: "Suppliers", active: false },
  { icon: Beaker, label: "Lab Tests", active: false },
  { icon: CreditCard, label: "Billing", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Today's Sales", value: "₹45,230", change: "+8%", trend: "up", icon: DollarSign, color: "text-green-600" },
  { label: "Prescriptions", value: "52", change: "+12%", trend: "up", icon: FileText, color: "text-blue-600" },
  { label: "Low Stock", value: "8", change: "-3", trend: "down", icon: AlertTriangle, color: "text-red-600" },
  { label: "New Customers", value: "15", change: "+5", trend: "up", icon: UserPlus, color: "text-purple-600" },
];

const salesData = [
  { name: "Mon", sales: 35000, prescriptions: 42 },
  { name: "Tue", sales: 42000, prescriptions: 48 },
  { name: "Wed", sales: 38000, prescriptions: 45 },
  { name: "Thu", sales: 45000, prescriptions: 52 },
  { name: "Fri", sales: 52000, prescriptions: 58 },
  { name: "Sat", sales: 48000, prescriptions: 55 },
  { name: "Sun", sales: 35000, prescriptions: 40 },
];

const categoryData = [
  { name: "Prescribed", value: 45, color: "#22c55e" },
  { name: "OTC", value: 30, color: "#3b82f6" },
  { name: "Supplements", value: 15, color: "#8b5cf6" },
  { name: "Medical Devices", value: 10, color: "#f59e0b" },
];

const medicines = [
  { name: "Paracetamol 500mg", category: "OTC", stock: 250, price: "₹25", expiry: "2027-06" },
  { name: "Amoxicillin 500mg", category: "Prescribed", stock: 120, price: "₹85", expiry: "2026-12" },
  { name: "Vitamin D3", category: "Supplements", stock: 180, price: "₹150", expiry: "2027-03" },
  { name: "Blood Pressure Monitor", category: "Devices", stock: 25, price: "₹1,200", expiry: "2028-01" },
  { name: "Azithromycin 500mg", category: "Prescribed", stock: 45, price: "₹120", expiry: "2026-09" },
  { name: "Calcium Supplements", category: "Supplements", stock: 200, price: "₹200", expiry: "2027-08" },
];

const prescriptions = [
  { id: "RX001", patient: "Rajesh Kumar", doctor: "Dr. Sharma", medicines: 3, amount: "₹450", status: "pending", time: "09:30 AM" },
  { id: "RX002", patient: "Priya Patel", doctor: "Dr. Verma", medicines: 5, amount: "₹890", status: "dispensed", time: "10:15 AM" },
  { id: "RX003", patient: "Amit Singh", doctor: "Dr. Gupta", medicines: 2, amount: "₹320", status: "pending", time: "11:00 AM" },
  { id: "RX004", patient: "Sunita Devi", doctor: "Dr. Singh", medicines: 4, amount: "₹680", status: "dispensed", time: "11:45 AM" },
];

const lowStockAlerts = [
  { medicine: "Azithromycin 500mg", current: 45, required: 100, urgency: "high" },
  { medicine: "Blood Pressure Monitor", current: 25, required: 50, urgency: "medium" },
  { medicine: "Metformin 500mg", current: 30, required: 80, urgency: "high" },
  { medicine: "Vitamin B12", current: 15, required: 50, urgency: "medium" },
];

const recentTransactions = [
  { id: "TXN001", customer: "Rajesh Kumar", items: "Paracetamol, Vitamin D3", amount: "₹320", method: "UPI", time: "09:45 AM" },
  { id: "TXN002", customer: "Priya Patel", items: "Amoxicillin, Panadol", amount: "₹450", method: "Cash", time: "10:30 AM" },
  { id: "TXN003", customer: "Amit Singh", items: "Blood Pressure Monitor", amount: "₹1,200", method: "Card", time: "11:15 AM" },
  { id: "TXN004", customer: "Sunita Devi", items: "Multivitamins, Calcium", amount: "₹580", method: "UPI", time: "12:00 PM" },
];

export default function PharmacyAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600">
          <span className="text-white font-bold text-xl">REZ Pharma</span>
        </div>

        {/* Navigation */}
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

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-gray-200 text-gray-500 hover:text-green-600 transition-colors"
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
            <span className="text-sm text-gray-500">Welcome back, Pharmacist</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search medicines..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-green-600">
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
            {/* Sales Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                    <Area type="monotone" dataKey="sales" stroke="#22c55e" fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales by Category</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
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
            {/* Low Stock Alerts */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={20} />
                  Low Stock Alerts
                </h3>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium">Order Now</button>
              </div>
              <div className="space-y-4">
                {lowStockAlerts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.medicine}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-red-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.urgency === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`}
                            style={{ width: `${(item.current / item.required) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{item.current}/{item.required}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      item.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {item.urgency}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Prescriptions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Prescriptions</h3>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {prescriptions.map((rx, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                        {rx.patient.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{rx.patient}</p>
                        <p className="text-xs text-gray-500">{rx.doctor}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">{rx.amount}</p>
                      {rx.status === "dispensed" ? (
                        <span className="text-xs text-green-600 flex items-center gap-1 justify-end">
                          <CheckCircle size={12} /> Dispensed
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

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {recentTransactions.map((tx, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.method === "UPI" ? "bg-green-100 text-green-600" :
                        tx.method === "Card" ? "bg-blue-100 text-blue-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        <CreditCard size={14} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{tx.customer}</p>
                        <p className="text-xs text-gray-500">{tx.items}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{tx.amount}</p>
                      <p className="text-xs text-gray-500">{tx.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Medicine Inventory Table */}
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Medicine Inventory</h3>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">
                Add Medicine
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Medicine</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Expiry</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Pill className="text-green-600" size={18} />
                          <span className="font-medium text-gray-800">{med.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          med.category === "Prescribed" ? "bg-blue-100 text-blue-600" :
                          med.category === "OTC" ? "bg-green-100 text-green-600" :
                          med.category === "Supplements" ? "bg-purple-100 text-purple-600" :
                          "bg-yellow-100 text-yellow-600"
                        }`}>
                          {med.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={med.stock < 50 ? "text-red-600 font-medium" : "text-gray-800"}>
                          {med.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800">{med.price}</td>
                      <td className="py-3 px-4 text-gray-600">{med.expiry}</td>
                      <td className="py-3 px-4">
                        {med.stock > 100 ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle size={14} /> In Stock
                          </span>
                        ) : med.stock > 30 ? (
                          <span className="flex items-center gap-1 text-yellow-600 text-sm">
                            <AlertCircle size={14} /> Low
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-sm">
                            <XCircle size={14} /> Critical
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
