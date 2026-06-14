"use client";

import { useState } from "react";
import { LayoutDashboard, Receipt, Wallet, FileText, Settings, Bell, Search, TrendingUp, TrendingDown, Plus } from "lucide-react";

const transactions = [
  { id: "TXN001", date: "Jun 8, 2026", description: "Invoice Payment - Acme Corp", amount: 45000, type: "credit", status: "Completed" },
  { id: "TXN002", date: "Jun 8, 2026", description: "Office Supplies", amount: 12500, type: "debit", status: "Completed" },
  { id: "TXN003", date: "Jun 7, 2026", description: "Invoice Payment - XYZ Ltd", amount: 32000, type: "credit", status: "Pending" },
  { id: "TXN004", date: "Jun 7, 2026", description: "Software Subscription", amount: 8999, type: "debit", status: "Completed" },
  { id: "TXN005", date: "Jun 6, 2026", description: "Consulting Fee", amount: 75000, type: "credit", status: "Completed" },
];

const invoices = [
  { id: "INV-001", client: "Acme Corp", amount: 45000, status: "Sent" },
  { id: "INV-002", client: "TechStart Inc", amount: 28000, status: "Paid" },
  { id: "INV-003", client: "Global Solutions", amount: 65000, status: "Overdue" },
];

export default function AccountingDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "expenses", label: "Expenses", icon: Wallet },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const stats = [
    { label: "Total Revenue", value: "₹12.5L", change: "+18%", isPositive: true, color: "bg-emerald-500" },
    { label: "Total Expenses", value: "₹4.2L", change: "+5%", isPositive: false, color: "bg-rose-500" },
    { label: "Outstanding", value: "₹2.8L", change: "-12%", isPositive: true, color: "bg-amber-500" },
    { label: "Net Profit", value: "₹8.3L", change: "+22%", isPositive: true, color: "bg-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="font-bold text-xl">
            <span className="text-emerald-600">REZ</span> Accounting
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    {stat.isPositive ? <TrendingUp className="w-6 h-6 text-white" /> : <TrendingDown className="w-6 h-6 text-white" />}
                  </span>
                  <span className={`text-sm font-medium ${stat.isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {transactions.map((txn) => (
                  <div key={txn.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{txn.description}</p>
                      <p className="text-sm text-slate-500">{txn.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${txn.type === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
                        {txn.type === "credit" ? "+" : "-"}₹{txn.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Invoices */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold">Pending Invoices</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{inv.client}</p>
                      <p className="text-sm text-slate-500">{inv.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">₹{inv.amount.toLocaleString()}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          inv.status === "Paid" ? "bg-emerald-100 text-emerald-700" :
                          inv.status === "Overdue" ? "bg-rose-100 text-rose-700" :
                          "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {inv.status}
                      </span>
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