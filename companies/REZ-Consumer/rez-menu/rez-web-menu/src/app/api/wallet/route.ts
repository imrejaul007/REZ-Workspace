/**
 * Wallet API Routes
 * Handles wallet balance, transactions, and coin operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

interface WalletBalance {
  coins: number
  cashback: number
  total: number
  currency: string
  pending: number
}

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  createdAt: string
  orderId?: string
}

// In-memory wallet storage (replace with MongoDB in production)
const wallets = new Map<string, WalletBalance>()
const transactions = new Map<string, Transaction[]>()

const INITIAL_COINS = 100 // Welcome bonus

function getOrCreateWallet(userId: string): WalletBalance {
  if (!wallets.has(userId)) {
    wallets.set(userId, {
      coins: INITIAL_COINS,
      cashback: 0,
      total: INITIAL_COINS,
      currency: 'INR',
      pending: 0
    })
    transactions.set(userId, [
      {
        id: `txn_${Date.now()}`,
        type: 'credit',
        amount: INITIAL_COINS,
        description: 'Welcome bonus',
        createdAt: new Date().toISOString()
      }
    ])
  }
  return wallets.get(userId)!
}

// GET - Get wallet balance
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID required' },
      { status: 401 }
    )
  }

  const wallet = getOrCreateWallet(userId)
  const userTransactions = transactions.get(userId) || []

  return NextResponse.json({
    success: true,
    data: {
      wallet,
      transactions: userTransactions.slice(0, 20) // Last 20 transactions
    }
  })
}

// POST - Add coins / Make payment
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID required' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { action, amount, description, orderId } = body as {
      action: 'add_coins' | 'redeem' | 'cashback' | 'refund'
      amount: number
      description: string
      orderId?: string
    }

    const wallet = getOrCreateWallet(userId)
    const userTransactions = transactions.get(userId) || []

    const transactionId = `txn_${Date.now()}_${randomBytes(4).toString('hex')}`

    switch (action) {
      case 'add_coins':
        wallet.coins += amount
        wallet.total += amount
        userTransactions.unshift({
          id: transactionId,
          type: 'credit',
          amount,
          description: description || 'Coins added',
          createdAt: new Date().toISOString(),
          orderId
        })
        break

      case 'cashback':
        wallet.cashback += amount
        wallet.total += amount
        userTransactions.unshift({
          id: transactionId,
          type: 'credit',
          amount,
          description: description || 'Cashback earned',
          createdAt: new Date().toISOString(),
          orderId
        })
        break

      case 'redeem':
        if (wallet.coins < amount) {
          return NextResponse.json(
            { success: false, error: 'Insufficient coins' },
            { status: 400 }
          )
        }
        wallet.coins -= amount
        wallet.total -= amount
        userTransactions.unshift({
          id: transactionId,
          type: 'debit',
          amount,
          description: description || 'Coins redeemed',
          createdAt: new Date().toISOString(),
          orderId
        })
        break

      case 'refund':
        wallet.coins += amount
        wallet.total += amount
        wallet.pending = Math.max(0, wallet.pending - amount)
        userTransactions.unshift({
          id: transactionId,
          type: 'credit',
          amount,
          description: description || 'Refund processed',
          createdAt: new Date().toISOString(),
          orderId
        })
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    wallets.set(userId, wallet)
    transactions.set(userId, userTransactions)

    return NextResponse.json({
      success: true,
      data: {
        wallet,
        transaction: userTransactions[0]
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process wallet action' },
      { status: 500 }
    )
  }
}
