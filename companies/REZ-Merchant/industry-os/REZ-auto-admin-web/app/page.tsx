"use client";

import { useState } from "react";
import { LayoutDashboard, Wrench, Users, Package, DollarSign, Settings, Bell, Search, Car, Clock, CheckCircle } from "lucide-react";

const jobs = [
  { id: "JOB-001", vehicle: "Maruti Swift", customer: "John Doe", service: "Full Service", status: "In Progress", mechanic: "Rajesh" },
  { id: "JOB-002", vehicle: "Honda City", customer: "Sarah Smith", service: "Oil Change", status: "Ready", mechanic: "Amit" },
  { id: "JOB-003", vehicle: "Hyundai Creta", customer: "Mike Wilson", service: "AC Repair", status: "In Progress", mechanic: "Rajesh" },
  { id: "JOB-004", vehicle: "Tata Nexon", customer: "Emma Brown", service: "Wheel Alignment", status: "Pending", mechanic: "Vikram" },
];

const parts = [
  { name: "Engine Oil (5W30)", stock: 25, minStock: 10, price: 850 },
  { name: "Air Filter", stock: 5, minStock: 8, price: 450 },
  { name: "Brake Pads (Front)", stock: 12, minStock: 5, price: 1200 },
  { name: "Oil Filter", stock: 18, minStock: 10, price: 180 },
];

export default function AutoDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "jobs", label: "Jobs", icon: Wrench },
    { id: "customers", label: "Customers", icon: Users },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "billing", label: "Billing", icon: DollarSign },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const stats = [
    { label: "Active Jobs", value: "8", change: "+3", color: "bg-teal-500" },
    { label: "Jobs Completed", value: "156", change: "+12", color: "bg-emerald-500" },
    { label: "Revenue (Month)", value: "₹4.5L", change: "+18%", color: "bg-amber-500" },
    { label: "Low Stock Items", value: "2", change: "-1", color: "bg-red-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="font-bold text-xl">
            <span className="text-teal-600">REZ</span> Auto
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? "bg-teal-50 text-teal-600" : "text-slate-600 hover:bg-slate-50"
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
              placeholder="Search jobs, customers..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  {i === 0 && <Wrench className="w-6 h-6 text-white" />}
                  {i === 1 && <CheckCircle className="w-6 h-6 text-white" />}
                  {i === 2 && <DollarSign className="w-6 h-6 text-white" />}
                  {i === 3 && <Package className="w-6 h-6 text-white" />}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold">Active Jobs</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {jobs.map((job) => (
                  <div key={job.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Car className="w-8 h-8 text-teal-600" />
                        <div>
                          <p className="font-medium">{job.vehicle}</p>
                          <p className="text-sm text-slate-500">{job.customer}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === "Ready" ? "bg-emerald-100 text-emerald-700" :
                          job.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Wrench className="w-4 h-4" /> {job.service}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {job.mechanic}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold">Low Stock Parts</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {parts.filter(p => p.stock < p.minStock * 2).map((part, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{part.name}</p>
                      <p className="text-sm text-slate-500">₹{part.price}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${part.stock < part.minStock ? "text-red-600" : "text-amber-600"}`}>
                        {part.stock} units
                      </p>
                      <p className="text-xs text-slate-500">Min: {part.minStock}</p>
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