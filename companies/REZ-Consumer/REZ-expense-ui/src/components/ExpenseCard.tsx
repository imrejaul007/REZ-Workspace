'use client'

import { ShoppingCart, Utensils, Car, ShoppingBag, Film, Zap, Heart, Package, MoreHorizontal } from 'lucide-react'

interface Expense {
  id: string
  merchant: string
  amount: number
  category: string
  date: string
  receiptUrl?: string
}

interface ExpenseCardProps {
  expense: Expense
  onClick?: () => void
}

const categoryConfig: Record<string, { icon: typeof ShoppingCart; color: string; bg: string }> = {
  Groceries: { icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-50' },
  Dining: { icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
  Transportation: { icon: Car, color: 'text-blue-600', bg: 'bg-blue-50' },
  Shopping: { icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-pink-50' },
  Entertainment: { icon: Film, color: 'text-purple-600', bg: 'bg-purple-50' },
  Utilities: { icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  Health: { icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
  Other: { icon: Package, color: 'text-gray-600', bg: 'bg-gray-50' },
}

export default function ExpenseCard({ expense, onClick }: ExpenseCardProps) {
  const config = categoryConfig[expense.category] || categoryConfig.Other
  const Icon = config.icon

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow active:bg-gray-50"
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${config.color}`} />
      </div>

      {/* Details */}
      <div className="flex-1 text-left">
        <p className="font-medium text-gray-900">{expense.merchant}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-gray-500">{expense.category}</span>
          <span className="text-gray-300">•</span>
          <span className="text-sm text-gray-500">{formatDate(expense.date)}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2">
        <p className="font-semibold text-gray-900">${expense.amount.toFixed(2)}</p>
        <MoreHorizontal className="w-5 h-5 text-gray-400" />
      </div>
    </button>
  )
}
