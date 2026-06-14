'use client';

import { useState } from 'react';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-white">TwinOS</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How it Works</a>
            <button className="px-6 py-2 text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
              Sign In
            </button>
            <button className="px-6 py-2 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:opacity-90 transition-opacity">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            The World's First Professional Twin Marketplace
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your Professional Intelligence,<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Always With You
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            TwinOS transforms hiring from "Company → Hire 1 Human" to "Company → Hire 1 Human + N AI Twins"
            <br />
            <span className="text-purple-400 font-semibold">3.5x - 10x productivity</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25">
              Start Free Trial
            </button>
            <button className="px-8 py-4 text-lg font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Demo
            </button>
          </div>

          <p className="text-slate-500 text-sm mt-6">No credit card required • 5 professional twins included</p>
        </div>
      </section>

      {/* Transformation Banner */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-3xl p-12 border border-purple-500/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="text-sm text-purple-400 font-medium mb-2">Today</div>
                <div className="text-3xl font-bold text-white">Company → Hire 1 Human</div>
                <div className="text-slate-400 mt-2">Productivity: 1x</div>
              </div>
              <div className="text-4xl text-purple-400">→</div>
              <div className="text-center md:text-right">
                <div className="text-sm text-green-400 font-medium mb-2">Tomorrow</div>
                <div className="text-3xl font-bold text-white">Company → Hire 1 Human + N Twins</div>
                <div className="text-green-400 mt-2 font-semibold">Productivity: 3.5x - 10x</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Twins Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">5 Professional Twins Per Employee</h2>
            <p className="text-slate-400 text-lg">Each twin specializes in a different aspect of your professional life</p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { name: 'Knowledge', icon: '🧠', color: 'from-blue-500 to-cyan-500', desc: 'What you know', multiplier: '1.5x', learn: 'SkillNet, Memory' },
              { name: 'Skill', icon: '🎯', color: 'from-green-500 to-emerald-500', desc: 'What you can do', multiplier: '2.5x', learn: 'Projects, Feedback' },
              { name: 'Career', icon: '📈', color: 'from-purple-500 to-violet-500', desc: 'Where you\'re going', multiplier: '1.0x', learn: 'Goals, Trends' },
              { name: 'Productivity', icon: '⚡', color: 'from-yellow-500 to-orange-500', desc: 'How you work', multiplier: '1.5x', learn: 'Patterns, Calendar' },
              { name: 'Execution', icon: '🚀', color: 'from-red-500 to-pink-500', desc: 'What you delegate', multiplier: '3.0x', learn: 'Sutar OS' },
            ].map((twin, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${twin.color} flex items-center justify-center text-3xl mb-4`}>
                  {twin.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{twin.name} Twin</h3>
                <p className="text-slate-400 text-sm mb-4">{twin.desc}</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold text-purple-400">{twin.multiplier}</span>
                  <span className="text-slate-500">productivity</span>
                </div>
                <div className="text-xs text-slate-500">
                  <span className="text-slate-400">Learns from:</span> {twin.learn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">The Trust Moat</h2>
            <p className="text-slate-400 text-lg">You OWN your twins. Not companies. That's the difference.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-red-400 mb-4">❌ Traditional HR Software</h3>
              <ul className="space-y-3 text-slate-300">
                <li>• Company OWNS your data</li>
                <li>• Data stays when you leave</li>
                <li>• No export capability</li>
                <li>• Company decides what you see</li>
                <li>• Locked into their ecosystem</li>
              </ul>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-green-400 mb-4">✅ TwinOS</h3>
              <ul className="space-y-3 text-slate-300">
                <li>• YOU OWN your professional twins</li>
                <li>• Twins travel when you change jobs</li>
                <li>• Full export anytime</li>
                <li>• You control all privacy settings</li>
                <li>• Portable across employers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Twins', desc: 'Connect your CorpID and your twins are automatically created with your skills and experience.' },
              { step: '02', title: 'Train & Learn', desc: 'Twins learn from your work via SkillNet, CorpPerks, and Memory. They get smarter every day.' },
              { step: '03', title: 'Get Hired', desc: 'Companies hire you + your twins. Your twins travel with you to your next job.' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-8xl font-bold text-slate-800 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple Pricing</h2>
            <p className="text-slate-400 text-lg">Start free. Scale as you grow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
              <div className="text-4xl font-bold text-white mb-1">Free</div>
              <p className="text-slate-400 mb-6">Forever free</p>
              <ul className="space-y-3 text-slate-300 mb-8">
                <li>✓ 1 Knowledge Twin</li>
                <li>✓ Export capability</li>
                <li>✓ Basic analytics</li>
                <li>✓ CorpID integration</li>
              </ul>
              <button className="w-full py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                Get Started
              </button>
            </div>

            <div className="bg-gradient-to-b from-purple-900/50 to-slate-800 rounded-2xl p-8 border border-purple-500/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 text-white text-sm font-medium rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <div className="text-4xl font-bold text-white mb-1">₹499<span className="text-lg font-normal text-slate-400">/mo</span></div>
              <p className="text-slate-400 mb-6">For professionals</p>
              <ul className="space-y-3 text-slate-300 mb-8">
                <li>✓ 3 Professional Twins</li>
                <li>✓ 10GB Memory</li>
                <li>✓ API access</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
              </ul>
              <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity">
                Start Free Trial
              </button>
            </div>

            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">Premium</h3>
              <div className="text-4xl font-bold text-white mb-1">₹999<span className="text-lg font-normal text-slate-400">/mo</span></div>
              <p className="text-slate-400 mb-6">For power users</p>
              <ul className="space-y-3 text-slate-300 mb-8">
                <li>✓ All 5 Professional Twins</li>
                <li>✓ 100GB Memory</li>
                <li>✓ Sutar OS execution</li>
                <li>✓ Custom training</li>
                <li>✓ Dedicated support</li>
              </ul>
              <button className="w-full py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Career?</h2>
          <p className="text-slate-400 text-lg mb-8">Join the world's first Professional Twin Economy</p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="px-6 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 flex-1 max-w-md focus:outline-none focus:border-purple-500"
                required
              />
              <button type="submit" className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
                Get Early Access
              </button>
            </form>
          ) : (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6">
              <p className="text-green-400 font-semibold text-lg">🎉 You're on the list!</p>
              <p className="text-slate-400">We'll notify you when TwinOS launches.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <span className="text-xl font-bold text-white">TwinOS</span>
            </div>
            <div className="flex items-center gap-6 text-slate-400 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-slate-500 text-sm">© 2026 TwinOS. Built on HOJAI AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
