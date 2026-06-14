"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Fuel,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Navigation,
  Clock,
  Wrench,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Truck, label: "Fleet", active: false },
  { icon: Users, label: "Drivers", active: false },
  { icon: MapPin, label: "Tracking", active: false },
  { icon: Fuel, label: "Fuel", active: false },
  { icon: Wrench, label: "Maintenance", active: false },
  { icon: DollarSign, label: "Expenses", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Active Vehicles", value: "45", change: "+3", trend: "up", icon: Truck, color: "text-blue-600" },
  { label: "Drivers On Duty", value: "38", change: "+5", trend: "up", icon: Users, color: "text-green-600" },
  { label: "Today's Trips", value: "156", change: "+12%", trend: "up", icon: Navigation, color: "text-purple-600" },
  { label: "Fuel Cost", value: "₹28,500", change: "-8%", trend: "down", icon: Fuel, color: "text-orange-600" },
];

const tripData = [
  { name: "Mon", trips: 120, distance: 2400 },
  { name: "Tue", trips: 145, distance: 2900 },
  { name: "Wed", trips: 138, distance: 2760 },
  { name: "Thu", trips: 152, distance: 3040 },
  { name: "Fri", trips: 168, distance: 3360 },
  { name: "Sat", trips: 145, distance: 2900 },
  { name: "Sun", trips: 98, distance: 1960 },
];

const vehicleStatus = [
  { name: "Active", value: 45, color: "#22c55e" },
  { name: "Idle", value: 8, color: "#f59e0b" },
  { name: "Maintenance", value: 5, color: "#ef4444" },
  { name: "Offline", value: 2, color: "#6b7280" },
];

const activeVehicles = [
  { id: "VH001", name: "Tata Ace XL", driver: "Rajesh Kumar", status: "On Trip", location: "Mumbai - Pune Highway", speed: "65 km/h" },
  { id: "VH002", name: "Mahindra Bolero", driver: "Amit Singh", status: "Loading", location: "Nashik Warehouse", speed: "0 km/h" },
  { id: "VH003", name: "Eicher Pro 1095", driver: "Suresh Patel", status: "On Trip", location: "Ahmedabad - Surat", speed: "72 km/h" },
  { id: "VH004", name: "Tata 407", driver: "Vikram Joshi", status: "Returning", location: "Pune City", speed: "45 km/h" },
];

const recentAlerts = [
  { type: "fuel", message: "VH005 fuel level below 15%", time: "10 min ago", severity: "high" },
  { type: "maintenance", message: "VH008 due for service", time: "30 min ago", severity: "medium" },
  { type: "speed", message: "VH012 overspeeding on NH-48", time: "45 min ago", severity: "high" },
  { type: "fuel", message: "VH003 fuel refill completed", time: "1 hr ago", severity: "low" },
];

const driverPerformance = [
  { name: "Rajesh Kumar", trips: 28, rating: 4.8, fuelEfficiency: "8.5 km/L" },
  { name: "Amit Singh", trips: 25, rating: 4.6, fuelEfficiency: "8.2 km/L" },
  { name: "Suresh Patel", trips: 22, rating: 4.9, fuelEfficiency: "9.1 km/L" },
  { name: "Vikram Joshi", trips: 20, rating: 4.7, fuelEfficiency: "8.8 km/L" },
];

export default function FleetAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700">
          <span className="text-white font-bold text-xl">REZ Fleet</span>
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
            <span className="text-sm text-gray-500">Fleet Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search vehicles..."
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Trips Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tripData}>
                    <defs>
                      <linearGradient id="colorFleet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="trips" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFleet)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Status</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={vehicleStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {vehicleStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {vehicleStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Vehicles */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Vehicles</h3>
              <div className="space-y-4">
                {activeVehicles.map((vehicle, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Truck className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{vehicle.name}</p>
                        <p className="text-sm text-gray-500">{vehicle.driver}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        vehicle.status === "On Trip" ? "bg-green-100 text-green-600" :
                        vehicle.status === "Loading" ? "bg-yellow-100 text-yellow-600" :
                        "bg-blue-100 text-blue-600"
                      }`}>
                        {vehicle.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{vehicle.speed}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-yellow-500" size={20} />
                Recent Alerts
              </h3>
              <div className="space-y-4">
                {recentAlerts.map((alert, index) => (
                  <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
                    alert.severity === "high" ? "bg-red-50" :
                    alert.severity === "medium" ? "bg-yellow-50" :
                    "bg-gray-50"
                  }`}>
                    <AlertTriangle className={
                      alert.severity === "high" ? "text-red-500" :
                      alert.severity === "medium" ? "text-yellow-500" :
                      "text-gray-400"
                    } size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver Performance */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Drivers</h3>
              <div className="space-y-4">
                {driverPerformance.map((driver, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                      {driver.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{driver.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{driver.trips} trips</span>
                        <span>•</span>
                        <span className="text-yellow-500">★ {driver.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">{driver.fuelEfficiency}</p>
                      <p className="text-xs text-gray-500">efficiency</p>
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
