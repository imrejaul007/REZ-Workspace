"use client";

import { useState } from "react";
import { LayoutDashboard, Users, BookOpen, Calendar, FileText, Settings, Bell, Search, GraduationCap, Award } from "lucide-react";

const students = [
  { id: 1, name: "Emma Thompson", grade: "10th Grade", attendance: "96%", performance: "Excellent" },
  { id: 2, name: "James Wilson", grade: "10th Grade", attendance: "88%", performance: "Good" },
  { id: 3, name: "Sophia Garcia", grade: "11th Grade", attendance: "92%", performance: "Excellent" },
  { id: 4, name: "Michael Brown", grade: "11th Grade", attendance: "78%", performance: "Needs Improvement" },
  { id: 5, name: "Olivia Martinez", grade: "12th Grade", attendance: "94%", performance: "Excellent" },
];

const courses = [
  { name: "Mathematics", students: 145, teacher: "Dr. Sharma", completion: "78%" },
  { name: "Physics", students: 120, teacher: "Prof. Gupta", completion: "72%" },
  { name: "Chemistry", students: 115, teacher: "Dr. Verma", completion: "68%" },
  { name: "Biology", students: 98, teacher: "Ms. Singh", completion: "82%" },
];

export default function EducationDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Students", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const stats = [
    { label: "Total Students", value: "456", change: "+24", color: "bg-blue-500" },
    { label: "Active Courses", value: "24", change: "+3", color: "bg-emerald-500" },
    { label: "Avg Attendance", value: "91%", change: "+3%", color: "bg-amber-500" },
    { label: "Top Performers", value: "128", change: "+15", color: "bg-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="font-bold text-xl">
            <span className="text-blue-600">REZ</span> Education
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
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
              placeholder="Search students, courses..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {i === 0 && <Users className="w-6 h-6 text-white" />}
                  {i === 1 && <BookOpen className="w-6 h-6 text-white" />}
                  {i === 2 && <Calendar className="w-6 h-6 text-white" />}
                  {i === 3 && <Award className="w-6 h-6 text-white" />}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold">Top Students</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {students.slice(0, 4).map((student) => (
                  <div key={student.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {student.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-slate-500">{student.grade}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-600">{student.performance}</p>
                      <p className="text-xs text-slate-500">Attendance: {student.attendance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold">Course Progress</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {courses.map((course, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{course.name}</p>
                        <p className="text-sm text-slate-500">{course.teacher}</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">{course.completion}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: course.completion }}
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