'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Filter, Download } from 'lucide-react'
import ExpenseCard from '@/components/ExpenseCard'

interface Expense {
  id: string
  merchant: string
  amount: number
  category: string
  date: string
}

const mockHistory: Expense[] = [
  { id: '1', merchant: 'Whole Foods Market', amount: 87.43, category: 'Groceries', date: '2026-05-12' },
  { id: '2', merchant: 'Shell Gas Station', amount: 45.20, category: 'Transportation', date: '2026-05-11' },
  { id: '3', merchant: 'Starbucks', amount: 12.85, category: 'Dining', date: '2026-05-10' },
  { id: '4', merchant: 'Amazon', amount: 34.99, category: 'Shopping', date: '2026-05-09' },
  { id: '5', merchant: 'Netflix', amount: 15.99, category: 'Entertainment', date: '2026-05-08' },
  { id: '6', merchant: 'Target', amount: 156.32, category: 'Shopping', date: '2026-05-07' },
  { id: '7', merchant: 'Chipotle', amount: 18.45, category: 'Dining', date: '2026-05-06' },
  { id: '8', merchant: 'CVS Pharmacy', amount: 23.99, category: 'Health', date: '2026-05-05' },
  { id: '9', merchant: 'Uber', amount: 24.50, category: 'Transportation', date: '2026-05-04' },
  { id: '10', merchant: 'Costco', amount: 234.87, category: 'Groceries', date: '2026-05-03' },
  { id: '11', merchant: 'Spotify', amount: 9.99, category: 'Entertainment', date: '2026-05-02' },
  { id: '12', merchant: 'Electric Company', amount: 145.00, category: 'Utilities', date: '2026-05-01' },
  { id: '13', merchant: 'Trader Joes', amount: 67.23, category: 'Groceries', date: '2026-04-30' },
  { id: '14', merchant: 'AMC Theaters', amount: 32.00, category: 'Entertainment', date: '2026-04-29' },
  { id: '15', merchant: 'Chevron', amount: 52.30, category: 'Transportation', date: '2026-04-28' },
]

const months = [
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-03', label: 'March 2026' },
]

export default function HistoryPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-05')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredExpenses = mockHistory.filter((expense) => {
    const matchesMonth = expense.date.startsWith(selectedMonth)
    const matchesSearch = expense.merchant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || expense.category === selectedCategory
    return matchesMonth && matchesSearch && matchesCategory
  })

  const totalForMonth = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number)
    return new Date(year, month, 0).getDate()
  }

  const groupByDate = () => {
    const grouped: Record<string, Expense[]> = {}
    filteredExpenses.forEach((expense) => {
      const day = expense.date.split('-')[2]
      if (!grouped[day]) grouped[day] = []
      grouped[day].push(expense)
    })
    return grouped
  }

  const groupedExpenses = groupByDate()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Expense History</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Download className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2">
          <button className="p-2 rounded-lg hover:bg-white">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <button className="p-2 rounded-lg hover:bg-white">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-indigo-200 text-sm">Total Spent</p>
            <p className="text-3xl font-bold mt-1">${totalForMonth.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-sm">Transactions</p>
            <p className="text-xl font-semibold mt-1">{filteredExpenses.length}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mx-4 mt-4 flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchants..."
            className="flex-1 outline-none text-gray-900 placeholder-gray-400"
          />
        </div>
        <button className="bg-white rounded-xl p-3 shadow-sm">
          <Filter className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="mx-4 mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            !selectedCategory
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 shadow-sm'
          }`}
        >
          All
        </button>
        {['Groceries', 'Dining', 'Transportation', 'Shopping', 'Entertainment', 'Utilities'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expense List */}
      <div className="mx-4 mt-4 space-y-4">
        {Object.entries(groupedExpenses).length > 0 ? (
          Object.entries(groupedExpenses).map(([day, expenses]) => (
            <div key={day}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">
                  {new Date(selectedMonth + '-' + day).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  ${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </span>
              </div>
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <ExpenseCard key={expense.id} expense={expense} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No expenses found for this period</p>
          </div>
        )}
      </div>
    </div>
  )
}
