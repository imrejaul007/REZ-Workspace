"use client";

import { useState } from "react";
import { LayoutDashboard, Users, Calendar, DollarSign, FileText, Settings, Bell, Search, LogOut } from "lucide-react";

const employees = [
  { id: 1, name: "Sarah Johnson", role: "Engineering Manager", department: "Engineering", status: "Active" },
  { id: 2, name: "Michael Chen", role: "Senior Developer", department: "Engineering", status: "Active" },
  { id: 3, name: "Emily Davis", role: "Marketing Lead", department: "Marketing", status: "Active" },
  { id: 4, name: "James Wilson", role: "Sales Executive", department: "Sales", status: "On Leave" },
  { id: 5, name: "Lisa Anderson", role: "HR Manager", department: "Human Resources", status: "Active" },
  { id: 6, name: "David Brown", role: "Financial Analyst", department: "Finance", status: "Active" },
];

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "employees", label: "Employees", icon: Users },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const stats = [
    { label: "Total Employees", value: "156", change: "+12%", color: "bg-blue-500" },
    { label: "On Leave Today", value: "8", change: "-3%", color: "bg-amber-500" },
    { label: "New Hires (Month)", value: "15", change: "+25%", color: "bg-emerald-500" },
    { label: "Attendance Rate", value: "94%", change: "+2%", color: "bg-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-slate-200">
          <h1 className={`font-bold text-xl ${sidebarOpen ? "" : "text-center"}`}>
            <span className="text-indigo-600">REZ</span> HR
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50"
              } ${sidebarOpen ? "" : "justify-center"}`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button className={`flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full ${sidebarOpen ? "" : "justify-center"}`}>
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees, departments..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold">LA</span>
              </div>
              <div>
                <p className="font-medium text-sm">Lisa Anderson</p>
                <p className="text-xs text-slate-500">HR Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    {i === 0 && <Users className="w-6 h-6 text-white" />}
                    {i === 1 && <Calendar className="w-6 h-6 text-white" />}
                    {i === 2 && <Users className="w-6 h-6 text-white" />}
                    {i === 3 && <FileText className="w-6 h-6 text-white" />}
                  </span>
                  <span className="text-emerald-500 text-sm font-medium">{stat.change}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Employee Table */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Employees</h2>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  + Add Employee
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Employee</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Department</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold">
                              {emp.name.split(" ").map((n) => n[0]).join("")}
                            </span>
                          </div>
                          <span className="font-medium">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{emp.role}</td>
                      <td className="px-6 py-4 text-slate-600">{emp.department}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            emp.status === "Active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View</button>
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