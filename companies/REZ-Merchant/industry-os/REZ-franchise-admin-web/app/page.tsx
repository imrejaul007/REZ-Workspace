"use client";

import { useState } from "react";
import { LayoutDashboard, MapPin, DollarSign, FileText, Settings, Bell, Search, Building2, TrendingUp, Users } from "lucide-react";

const locations = [
  { name: "Delhi NCR", stores: 5, revenue: 125000, target: 100000, status: "On Track" },
  { name: "Mumbai", stores: 4, revenue: 156000, target: 120000, status: "Above Target" },
  { name: "Bangalore", stores: 3, revenue: 89000, target: 100000, status: "Below Target" },
  { name: "Chennai", stores: 2, revenue: 67000, target: 80000, status: "Below Target" },
  { name: "Hyderabad", stores: 3, revenue: 98000, target: 90000, status: "On Track" },
];

export default function FranchiseDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "royalties", label: "Royalties", icon: DollarSign },
    { id: "compliance", label: "Compliance", icon: FileText },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const stats = [
    { label: "Total Locations", value: "17", change: "+3", color: "bg-red-500" },
    { label: "Total Stores", value: "45", change: "+8", color: "bg-blue-500" },
    { label: "Total Revenue", value: "₹45.5L", change: "+22%", color: "bg-emerald-500" },
    { label: "Avg Performance", value: "98%", change: "+5%", color: "bg-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="font-bold text-xl">
            <span className="text-red-600">REZ</span> Franchise
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? "bg-red-50 text-red-600" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search locations..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  {i === 0 && <Building2 className="w-6 h-6 text-white" />}
                  {i === 1 && <MapPin className="w-6 h-6 text-white" />}
                  {i === 2 && <TrendingUp className="w-6 h-6 text-white" />}
                  {i === 3 && <Users className="w-6 h-6 text-white" />}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold">Location Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Stores</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Revenue</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Target</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Progress</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {locations.map((loc, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">{loc.name}</td>
                      <td className="px-6 py-4 text-slate-600">{loc.stores}</td>
                      <td className="px-6 py-4 font-medium text-emerald-600">₹{loc.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">₹{loc.target.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="w-32 h-2 bg-slate-100 rounded-full">
                          <div
                            className={`h-2 rounded-full ${loc.status === "Above Target" ? "bg-emerald-500" : loc.status === "Below Target" ? "bg-red-500" : "bg-blue-500"}`}
                            style={{ width: `${Math.min(100, (loc.revenue / loc.target) * 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            loc.status === "Above Target" ? "bg-emerald-100 text-emerald-700" :
                            loc.status === "Below Target" ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {loc.status}
                        </span>
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