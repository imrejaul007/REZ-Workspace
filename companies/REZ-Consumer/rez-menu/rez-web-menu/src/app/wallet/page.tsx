'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/format'
import { useAuth, getUserId } from '@/hooks/useAuth'
import { logger } from '@/lib/logger'

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  createdAt: string
  orderId?: string
}

interface WalletData {
  coins: number
  cashback: number
  total: number
  currency: string
  pending: number
}

export default function WalletPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadWallet() {
      const userId = getUserId()
      if (!userId) return

      try {
        const response = await fetch('/api/wallet', {
          headers: { 'x-user-id': userId }
        })
        const data = await response.json()

        if (data.success) {
          setWallet(data.data.wallet)
          setTransactions(data.data.transactions)
        }
      } catch (error) {
        logger.error('Failed to load wallet', error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWallet()
  }, [])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">My Wallet</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Balance Card */}
        <section className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🪙</span>
            <div>
              <p className="text-amber-100 text-sm">Available Balance</p>
              <p className="text-4xl font-bold">{wallet?.coins.toFixed(0) || 0}</p>
              <p className="text-amber-100 text-sm">{formatPrice(wallet?.total || 0)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-amber-400">
            <div>
              <p className="text-amber-100 text-xs">REZ Coins</p>
              <p className="font-bold">{wallet?.coins.toFixed(0) || 0}</p>
            </div>
            <div>
              <p className="text-amber-100 text-xs">Cashback</p>
              <p className="font-bold">{formatPrice(wallet?.cashback || 0)}</p>
            </div>
            <div>
              <p className="text-amber-100 text-xs">Pending</p>
              <p className="font-bold">{formatPrice(wallet?.pending || 0)}</p>
            </div>
          </div>
        </section>

        {/* Earn More */}
        <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Earn More Coins</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl">🛒</span>
              <div>
                <p className="font-medium text-gray-900">Place Orders</p>
                <p className="text-xs text-gray-500">Earn 10% back</p>
              </div>
            </Link>
            <Link
              href="/refer"
              className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-medium text-gray-900">Refer Friends</p>
                <p className="text-xs text-gray-500">Earn 50 coins</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Transaction History */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h2>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">📜</span>
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    txn.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {txn.type === 'credit' ? '+' : '-'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{txn.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`font-bold ${
                    txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {txn.type === 'credit' ? '+' : '-'}{txn.amount.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
