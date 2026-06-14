'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, DollarSign, Calendar, Tag, Store, Check, X } from 'lucide-react'
import Link from 'next/link'

const categories = [
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: 'bg-green-100 text-green-600' },
  { id: 'dining', name: 'Dining', icon: '🍽️', color: 'bg-orange-100 text-orange-600' },
  { id: 'transportation', name: 'Transportation', icon: '🚗', color: 'bg-blue-100 text-blue-600' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: 'bg-pink-100 text-pink-600' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'bg-purple-100 text-purple-600' },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'health', name: 'Health', icon: '💊', color: 'bg-red-100 text-red-600' },
  { id: 'other', name: 'Other', icon: '📦', color: 'bg-gray-100 text-gray-600' },
]

export default function AddExpensePage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !merchant || !category) return

    // Simulate API call
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      router.push('/')
    }, 1500)
  }

  const isValid = amount && parseFloat(amount) > 0 && merchant && category

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Add Expense</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Amount Input */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-500 mb-2">Amount</label>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-gray-900">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-4xl font-bold text-gray-900 w-full bg-transparent outline-none placeholder-gray-300"
            />
          </div>
        </div>

        {/* Merchant Input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-500 mb-2">Merchant</label>
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Where did you spend?"
              className="flex-1 text-gray-900 outline-none placeholder-gray-400"
            />
          </div>
        </div>

        {/* Category Selection */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-500 mb-3">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  category === cat.id
                    ? 'bg-indigo-50 border-2 border-indigo-500'
                    : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs mt-1 text-gray-600">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-500 mb-2">Date</label>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 text-gray-900 outline-none"
            />
          </div>
        </div>

        {/* Note Input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-500 mb-2">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="w-full text-gray-900 outline-none placeholder-gray-400 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            isValid
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 active:scale-98'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          Save Expense
        </button>
      </form>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 mx-8 text-center animate-bounce-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Expense Saved!</h2>
            <p className="text-gray-500">Your expense has been recorded.</p>
          </div>
        </div>
      )}
    </div>
  )
}
