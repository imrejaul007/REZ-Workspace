/**
 * Consumer Portal - Referrals
 */
import { useState } from 'react'
import PortalLayout from '@/layouts/PortalLayout'

export default function ConsumerReferrals() {
  const [copied, setCopied] = useState(false)
  const referralCode = 'RISNA2026XYZ'

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const referralSteps = [
    { step: 1, title: 'Share Your Code', desc: 'Share your referral code with friends' },
    { step: 2, title: 'Friend Registers', desc: 'They sign up using your code' },
    { step: 3, title: 'They Book', desc: 'Friend books a property' },
    { step: 4, title: 'You Earn', desc: 'Get rewarded with coins' },
  ]

  const recentReferrals = [
    { name: 'John D.', status: 'Registered', date: 'Mar 20', reward: 'Pending' },
    { name: 'Sarah M.', status: 'Booked', date: 'Mar 18', reward: 'AED 5,000' },
  ]

  return (
    <PortalLayout portal="consumer">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl p-8 mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Refer & Earn</h1>
          <p className="text-lg opacity-90 mb-6">Earn rewards when your friends book properties</p>

          <div className="bg-white/20 rounded-xl p-6">
            <p className="text-sm mb-2">Your Referral Code</p>
            <p className="text-4xl font-bold tracking-widest mb-4">{referralCode}</p>
            <button
              onClick={copyCode}
              className="px-8 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100"
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">How It Works</h2>
          <div className="grid grid-cols-4 gap-4">
            {referralSteps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-600">{item.step}</span>
                </div>
                <h3 className="font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Reward Tiers</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-1">Friend Signs Up</p>
              <p className="text-2xl font-bold text-green-600">AED 500</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-1">Friend Books</p>
              <p className="text-2xl font-bold text-green-600">AED 5,000</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center border-2 border-yellow-400">
              <p className="text-sm text-yellow-600 mb-1">Multiple Referrals</p>
              <p className="text-2xl font-bold text-yellow-600">Bonus!</p>
            </div>
          </div>
        </div>

        {/* Recent Referrals */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Your Referrals</h2>
          {recentReferrals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No referrals yet. Start sharing your code!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReferrals.map((ref, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{ref.name}</p>
                    <p className="text-sm text-gray-500">{ref.status} • {ref.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ref.reward === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {ref.reward}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
