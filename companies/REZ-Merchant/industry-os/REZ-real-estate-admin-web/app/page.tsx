"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Home,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  MapPin,
  DollarSign,
  Key,
  Calendar,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Building2, label: "Properties", active: false },
  { icon: Users, label: "Leads", active: false },
  { icon: Home, label: "Listings", active: false },
  { icon: Calendar, label: "Site Visits", active: false },
  { icon: CreditCard, label: "Deals", active: false },
  { icon: BarChart3, label: "Reports", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Active Listings", value: "48", change: "+5", trend: "up", icon: Home, color: "text-purple-600" },
  { label: "New Leads", value: "125", change: "+18%", trend: "up", icon: Users, color: "text-blue-600" },
  { label: "Site Visits", value: "32", change: "+12", trend: "up", icon: Calendar, color: "text-green-600" },
  { label: "Revenue", value: "₹2.5Cr", change: "+22%", trend: "up", icon: DollarSign, color: "text-yellow-600" },
];

const revenueData = [
  { name: "Mon", revenue: 1800000, deals: 4 },
  { name: "Tue", revenue: 2200000, deals: 5 },
  { name: "Wed", revenue: 1950000, deals: 4 },
  { name: "Thu", revenue: 2800000, deals: 6 },
  { name: "Fri", revenue: 3200000, deals: 7 },
  { name: "Sat", revenue: 2500000, deals: 5 },
];

const propertyTypeData = [
  { name: "Apartments", value: 35, color: "#8b5cf6" },
  { name: "Villas", value: 25, color: "#3b82f6" },
  { name: "Plots", value: 20, color: "#22c55e" },
  { name: "Commercial", value: 20, color: "#f59e0b" },
];

const recentLeads = [
  { name: "Rahul Sharma", phone: "9876543210", budget: "₹50-80L", interested: "2BHK Apartment", status: "hot", source: "Website" },
  { name: "Priya Patel", phone: "9876543211", budget: "₹80-100L", interested: "3BHK Villa", status: "warm", source: "Facebook" },
  { name: "Amit Singh", phone: "9876543212", budget: "₹30-50L", interested: "1BHK Apartment", status: "hot", source: "Google" },
  { name: "Sneha Gupta", phone: "9876543213", budget: "₹1-1.5Cr", interested: "Penthouse", status: "cold", source: "Referral" },
];

const propertyListings = [
  { name: "Sunrise Heights", type: "2BHK Apartment", price: "₹65L", location: "Whitefield", status: "available", views: 245 },
  { name: "Green Valley", type: "3BHK Villa", price: "₹1.2Cr", location: "Sarjapur", status: "available", views: 189 },
  { name: "Urban Nest", type: "1BHK Apartment", price: "₹42L", location: "Koramangala", status: "booked", views: 312 },
];

const upcomingVisits = [
  { time: "10:00 AM", property: "Sunrise Heights", client: "Rahul Sharma", status: "confirmed" },
  { time: "11:30 AM", property: "Green Valley", client: "Priya Patel", status: "confirmed" },
  { time: "02:00 PM", property: "Urban Nest", client: "Amit Singh", status: "pending" },
];

export default function RealEstateAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-600">
          <span className="text-white font-bold text-xl">REZ Realty</span>
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
            <span className="text-sm text-gray-500">Real Estate Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search properties..."
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRERevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRERevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Property Types</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={propertyTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {propertyTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {propertyTypeData.map((item, index) => (
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
            {/* Recent Leads */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Leads</h3>
              <div className="space-y-4">
                {recentLeads.map((lead, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{lead.name}</p>
                      <p className="text-sm text-gray-500">{lead.interested} • {lead.budget}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      lead.status === "hot" ? "bg-red-100 text-red-600" :
                      lead.status === "warm" ? "bg-yellow-100 text-yellow-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Listings */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Listings</h3>
              <div className="space-y-4">
                {propertyListings.map((property, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{property.name}</p>
                      <p className="text-sm text-gray-500">{property.type} • {property.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-600">{property.price}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        property.status === "available" ? "bg-green-100 text-green-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {property.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Visits */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Site Visits Today</h3>
              <div className="space-y-4">
                {upcomingVisits.map((visit, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center">
                        <p className="font-semibold text-gray-800">{visit.time}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{visit.property}</p>
                        <p className="text-sm text-gray-500">{visit.client}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      visit.status === "confirmed" ? "bg-green-100 text-green-600" :
                      "bg-yellow-100 text-yellow-600"
                    }`}>
                      {visit.status}
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