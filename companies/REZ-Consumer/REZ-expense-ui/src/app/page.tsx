'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Camera, Plus, Receipt, TrendingUp, Calendar, ChevronRight } from 'lucide-react'
import ReceiptScanner from '@/components/ReceiptScanner'
import ExpenseCard from '@/components/ExpenseCard'
import CategoryBreakdown from '@/components/CategoryBreakdown'

interface Expense {
  id: string
  merchant: string
  amount: number
  category: string
  date: string
  receiptUrl?: string
}

const mockExpenses: Expense[] = [
  { id: '1', merchant: 'Whole Foods Market', amount: 87.43, category: 'Groceries', date: '2026-05-12' },
  { id: '2', merchant: 'Shell Gas Station', amount: 45.20, category: 'Transportation', date: '2026-05-11' },
  { id: '3', merchant: 'Starbucks', amount: 12.85, category: 'Dining', date: '2026-05-10' },
  { id: '4', merchant: 'Amazon', amount: 34.99, category: 'Shopping', date: '2026-05-09' },
  { id: '5', merchant: 'Netflix', amount: 15.99, category: 'Entertainment', date: '2026-05-08' },
]

export default function HomePage() {
  const [showScanner, setShowScanner] = useState(false)
  const [expenses] = useState<Expense[]>(mockExpenses)
  const [activeTab, setActiveTab] = useState<'recent' | 'chart'>('recent')

  const totalThisMonth = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-indigo-200 text-sm">May 2026</p>
            <h1 className="text-3xl font-bold">$1,847.52</h1>
            <p className="text-indigo-200 text-xs flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              12% less than last month
            </p>
          </div>
          <div className="bg-white/20 rounded-full p-3">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-indigo-200">Transactions</p>
            <p className="text-lg font-semibold">24</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-indigo-200">Avg/Day</p>
            <p className="text-lg font-semibold">$61.58</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-indigo-200">Top Category</p>
            <p className="text-lg font-semibold">Groceries</p>
          </div>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 px-4 -mt-4">
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'recent'
              ? 'bg-white shadow-lg text-indigo-600'
              : 'bg-white/50 text-gray-500'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'chart'
              ? 'bg-white shadow-lg text-indigo-600'
              : 'bg-white/50 text-gray-500'
          }`}
        >
          Categories
        </button>
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        {activeTab === 'recent' ? (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        ) : (
          <CategoryBreakdown />
        )}
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <ReceiptScanner onClose={() => setShowScanner(false)} />
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom">
        <div className="max-w-md mx-auto flex justify-around py-3">
          <Link href="/" className="flex flex-col items-center text-indigo-600">
            <Receipt className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Expenses</span>
          </Link>
          <Link href="/history" className="flex flex-col items-center text-gray-400">
            <Calendar className="w-6 h-6" />
            <span className="text-xs mt-1">History</span>
          </Link>
          <button
            onClick={() => setShowScanner(true)}
            className="flex flex-col items-center -mt-6"
          >
            <div className="bg-indigo-600 text-white rounded-full p-4 shadow-lg shadow-indigo-200">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-xs mt-1 text-gray-500">Scan</span>
          </button>
          <Link href="/add" className="flex flex-col items-center text-gray-400">
            <Plus className="w-6 h-6" />
            <span className="text-xs mt-1">Add</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
