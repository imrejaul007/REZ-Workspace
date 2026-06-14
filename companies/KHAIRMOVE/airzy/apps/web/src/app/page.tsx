'use client';

import { useState } from 'react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('flights');

  const stats = {
    coins: 2847,
    tier: 'Elite',
    loungeVisits: 3,
    nextTierProgress: 72,
  };

  const upcomingTrips = [
    { id: '1', name: 'Bangalore → Delhi', dates: 'May 25-27', status: 'confirmed' },
    { id: '2', name: 'Mumbai Business', dates: 'Jun 10-12', status: 'planning' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-600 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Airzy</h1>
            <p className="text-primary-200 text-sm">Smart companion for frequent travelers</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-primary-200">Coins Balance</p>
              <p className="text-2xl font-bold">{stats.coins.toLocaleString()}</p>
            </div>
            <div className="bg-white text-primary-600 px-4 py-2 rounded-full font-semibold">
              {stats.tier}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="max-w-6xl mx-auto px-6 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.coins.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Coins</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.loungeVisits}</p>
            <p className="text-sm text-gray-500">Lounge Visits</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">2.0x</p>
            <p className="text-sm text-gray-500">Coin Multiplier</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">{stats.nextTierProgress}%</p>
            <p className="text-sm text-gray-500">To Royale</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <nav className="flex gap-2 border-b border-gray-200">
          {['flights', 'lounges', 'hotels', 'transfers', 'trips'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {activeTab === 'flights' && 'Search Flights'}
            {activeTab === 'lounges' && 'Find Lounges'}
            {activeTab === 'hotels' && 'Airport Hotels'}
            {activeTab === 'transfers' && 'Airport Transfers'}
            {activeTab === 'trips' && 'My Trips'}
          </h2>

          {activeTab === 'flights' && (
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="text"
                  placeholder="BLR"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="text"
                  placeholder="DEL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option>1 Adult</option>
                  <option>2 Adults</option>
                  <option>1 Adult + 1 Child</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'lounges' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Airport</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                  <option value="">Select Airport</option>
                  <option value="BLR">Bangalore (BLR)</option>
                  <option value="DEL">Delhi (DEL)</option>
                  <option value="BOM">Mumbai (BOM)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                  <option>1 Guest</option>
                  <option>2 Guests</option>
                  <option>3 Guests</option>
                </select>
              </div>
            </div>
          )}

          <button className="mt-4 bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
            Search {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </button>
        </div>

        {/* Upcoming Trips */}
        {activeTab === 'trips' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
              <button className="text-primary-600 font-medium">+ Create Trip</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {upcomingTrips.map((trip) => (
                <div key={trip.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{trip.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      trip.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{trip.dates}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🤖</span>
                <h3 className="text-lg font-semibold">AI Travel Tips</h3>
              </div>
              <p className="text-primary-100">
                You usually order coffee at T2 before boarding. ☕ 20% cashback available at Starbucks nearby!
              </p>
            </div>
            <button className="bg-white/20 px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors">
              View More
            </button>
          </div>
        </div>

        {/* Membership Tiers */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Membership Tiers</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { name: 'Basic', price: 'Free', coins: '1.0x', visits: 0 },
              { name: 'Plus', price: '₹2,999', coins: '1.5x', visits: 2 },
              { name: 'Elite', price: '₹9,999', coins: '2.0x', visits: 5, popular: true },
              { name: 'Royale', price: '₹29,999', coins: '3.0x', visits: '∞' },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`bg-white rounded-xl p-4 border-2 ${
                  tier.popular ? 'border-primary-600 relative' : 'border-gray-100'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-4 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    POPULAR
                  </span>
                )}
                <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                <p className="text-2xl font-bold text-gray-900 my-2">{tier.price}</p>
                <p className="text-sm text-gray-500 mb-2">per year</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{tier.coins} coin rate</p>
                  <p>{tier.visits} free lounge visits</p>
                </div>
                {tier.name !== 'Basic' && (
                  <button className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${
                    tier.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}>
                    Upgrade
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-8 mt-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Airzy</h2>
            <p className="text-gray-400 text-sm mt-1">Smart companion for frequent travelers</p>
          </div>
          <div className="text-sm text-gray-400">
            © 2026 RTNM Group. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
