/**
 * AssetMind Frontend - Main App
 * Next.js 14 with App Router
 */

import React from 'react';
import Link from 'next/link';

// Simple landing page
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AssetMind</h1>
            <p className="text-xs text-gray-400">Financial Intelligence Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
            Dashboard
          </Link>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-24 max-w-4xl mx-auto text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          The World's Financial<br />
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Intelligence Platform
          </span>
        </h2>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Every asset gets a Digital Twin. Continuously learning from data, events,
          predictions, and outcomes to power better financial decisions.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard">
            <button className="px-8 py-4 bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors">
              Launch App
            </button>
          </Link>
          <button className="px-8 py-4 border border-gray-600 text-white rounded-xl text-lg font-semibold hover:bg-gray-800 transition-colors">
            Learn More
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <h3 className="text-3xl font-bold text-white text-center mb-16">
          The Five Twins
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Asset Twin', desc: 'Every stock, crypto, forex, forever' },
            { name: 'Market Twin', desc: 'Global market conditions' },
            { name: 'Portfolio Twin', desc: 'Your portfolio, fully analyzed' },
            { name: 'Investor Twin', desc: 'Your behavior, mistakes, coaching' },
            { name: 'Intelligence Twin', desc: 'Predictions improve with age' },
            { name: 'Knowledge Graph', desc: 'Every relationship mapped' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-2">{item.name}</h4>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-800 text-center text-gray-500">
        <p>© 2026 AssetMind. Financial Intelligence Infrastructure.</p>
      </footer>
    </main>
  );
}
