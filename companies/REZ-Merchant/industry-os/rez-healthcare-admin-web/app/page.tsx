"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
  Heart,
  Pill,
  AlertCircle,
  Settings,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Stethoscope, label: "Patients", active: false },
  { icon: Calendar, label: "Appointments", active: false },
  { icon: Pill, label: "Pharmacy", active: false },
  { icon: FileText, label: "Records", active: false },
  { icon: CreditCard, label: "Billing", active: false },
  { icon: Activity, label: "Diagnostics", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const stats = [
  { label: "Today's Patients", value: "48", change: "+12%", trend: "up", icon: Users, color: "text-blue-600" },
  { label: "Appointments", value: "35", change: "+8%", trend: "up", icon: Calendar, color: "text-green-600" },
  { label: "Revenue", value: "₹1,25,000", change: "+15%", trend: "up", icon: DollarSign, color: "text-purple-600" },
  { label: "Pending Reports", value: "8", change: "-3", trend: "down", icon: FileText, color: "text-orange-600" },
];

const patientData = [
  { name: "Mon", patients: 45, revenue: 85000 },
  { name: "Tue", patients: 52, revenue: 98000 },
  { name: "Wed", patients: 48, revenue: 92000 },
  { name: "Thu", patients: 55, revenue: 105000 },
  { name: "Fri", patients: 62, revenue: 118000 },
  { name: "Sat", patients: 38, revenue: 72000 },
  { name: "Sun", patients: 25, revenue: 48000 },
];

const departmentData = [
  { name: "General", value: 30, color: "#3b82f6" },
  { name: "Cardiology", value: 20, color: "#ef4444" },
  { name: "Orthopedics", value: 18, color: "#22c55e" },
  { name: "Pediatrics", value: 15, color: "#f59e0b" },
  { name: "Other", value: 17, color: "#8b5cf6" },
];

const upcomingAppointments = [
  { time: "10:00 AM", patient: "Rajesh Kumar", doctor: "Dr. Priya Sharma", type: "Follow-up", status: "confirmed" },
  { time: "11:30 AM", patient: "Priya Patel", doctor: "Dr. Amit Singh", type: "New", status: "confirmed" },
  { time: "01:00 PM", patient: "Amit Singh", doctor: "Dr. Sunita Verma", type: "Checkup", status: "pending" },
  { time: "02:30 PM", patient: "Sunita Devi", doctor: "Dr. Vikram Joshi", type: "Follow-up", status: "confirmed" },
];

const recentPatients = [
  { name: "Rajesh Kumar", age: 45, condition: "Diabetes", status: "Under Treatment", lastVisit: "Today" },
  { name: "Priya Patel", age: 32, condition: "Flu", status: "Recovering", lastVisit: "Today" },
  { name: "Amit Singh", age: 58, condition: "Hypertension", status: "Under Treatment", lastVisit: "Yesterday" },
  { name: "Sunita Devi", age: 41, condition: "Back Pain", status: "Scheduled", lastVisit: "Tomorrow" },
];

const doctorSchedule = [
  { name: "Dr. Priya Sharma", specialty: "General Physician", patients: 12, available: "10:00 AM - 6:00 PM" },
  { name: "Dr. Amit Singh", specialty: "Cardiologist", patients: 8, available: "9:00 AM - 5:00 PM" },
  { name: "Dr. Sunita Verma", specialty: "Pediatrician", patients: 15, available: "11:00 AM - 7:00 PM" },
  { name: "Dr. Vikram Joshi", specialty: "Orthopedic", patients: 10, available: "10:00 AM - 4:00 PM" },
];

export default function HealthcareAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-cyan-500 to-blue-600">
          <span className="text-white font-bold text-xl">REZ Health</span>
        </div>
        <nav className="flex-1 py-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors ${
                item.active ? "bg-cyan-50 text-cyan-600 border-r-4 border-cyan-600" : ""
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 border-t border-gray-200 text-gray-500 hover:text-cyan-600">
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <span className="text-sm text-gray-500">Healthcare Management</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search patients..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button className="relative p-2 text-gray-500 hover:text-cyan-600">
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
                  <div className={`p-3 rounded-lg bg-cyan-50 ${stat.color}`}>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={patientData}>
                    <defs>
                      <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="patients" stroke="#06b6d4" fillOpacity={1} fill="url(#colorHealth)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Departments</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={departmentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {departmentData.map((item, index) => (
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
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Appointments</h3>
              <div className="space-y-4">
                {upcomingAppointments.map((apt, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {apt.time.split(" ")[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{apt.patient}</p>
                      <p className="text-sm text-gray-500">{apt.doctor}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        apt.status === "confirmed" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Patients */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Patients</h3>
              <div className="space-y-4">
                {recentPatients.map((patient, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{patient.name}</p>
                      <p className="text-sm text-gray-500">{patient.condition} • {patient.age} yrs</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      patient.status === "Under Treatment" ? "bg-blue-100 text-blue-600" :
                      patient.status === "Recovering" ? "bg-green-100 text-green-600" :
                      "bg-yellow-100 text-yellow-600"
                    }`}>
                      {patient.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Schedule */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Stethoscope className="text-cyan-600" size={20} />
                Doctor Schedule
              </h3>
              <div className="space-y-4">
                {doctorSchedule.map((doctor, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      {doctor.name.split(" ")[1].charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{doctor.name}</p>
                      <p className="text-sm text-gray-500">{doctor.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-cyan-600">{doctor.patients} patients</p>
                      <p className="text-xs text-gray-500">{doctor.available}</p>
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
