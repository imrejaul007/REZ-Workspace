'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';

const BENEFITS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    title: 'QR at Every Table',
    body: 'Customers scan the QR code and order directly from their phone. No app download, no waiting for a waiter.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: 'Instant Payments',
    body: 'Accept UPI, cards, and wallets via Razorpay. Money settles in your account the same day.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Earn REZ Coins',
    body: 'Every order earns REZ coins. Customers return to spend them — driving repeat visits and brand loyalty.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Live Analytics',
    body: "See today's revenue, order count, and outlet performance in your merchant dashboard.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Staff Tools Included',
    body: 'Kitchen display, waiter call alerts, bill builder, and reconcile — everything your team needs in one place.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Secure & Reliable',
    body: "Built on Razorpay's payment infrastructure. PCI-compliant. 99.9% uptime SLA.",
  },
];

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: '₹999',
    period: '/month',
    description: 'For single-outlet restaurants',
    features: ['1 outlet', 'QR ordering & payments', 'Merchant dashboard', 'Basic analytics'],
    cta: 'Apply for early access',
    ctaHref: 'mailto:grow@rez.money?subject=Join REZ Now — Starter',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '₹2,499',
    period: '/month',
    description: 'For multi-outlet chains',
    features: ['Up to 5 outlets', 'Everything in Starter', 'Multi-outlet analytics', 'Staff management', 'Priority support'],
    cta: 'Start 14-day trial',
    ctaHref: 'mailto:grow@rez.money?subject=Join REZ Now — Growth',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large restaurant groups',
    features: ['Unlimited outlets', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', 'White-label options'],
    cta: 'Contact sales',
    ctaHref: 'mailto:grow@rez.money?subject=REZ Now Enterprise Inquiry',
    highlight: false,
  },
];

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)]">
      {/* Nav */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-gray-900">REZ Now</span>
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Back to home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-4 py-20 text-center overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-500 opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-400 opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-200 mb-4">
            For Restaurants &amp; Cafes
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            QR-based ordering<br />
            <span className="text-indigo-200">built for repeat revenue</span>
          </h1>
          <p className="mt-6 text-lg text-indigo-100 max-w-lg mx-auto leading-relaxed">
            Customers scan a QR at their table, order from their phone, and pay instantly. You get more orders, less wait time, and loyal customers who earn coins on every visit.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="mailto:grow@rez.money?subject=Join REZ Now — Restaurant Inquiry">
              <Button variant="primary-white" size="lg">
                Apply for early access
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline-white" size="lg">
                See how it works
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-indigo-200">
            No setup fee &middot; No commission on coins earned &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">Everything you need to grow</h2>
          <p className="mt-3 text-gray-500">One platform for ordering, payments, and customer loyalty</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-gray-50 rounded-2xl p-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-4">
                {b.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{b.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'You get a QR code', body: 'We generate a unique QR code for each table. Print it, laminate it, stick it.' },
              { step: '02', title: 'Customer scans & orders', body: 'Scan opens your menu. No app download. No account needed. Browse, customize, and pay.' },
              { step: '03', title: 'You get paid. They earn coins.', body: 'Money settles same day via Razorpay. Customers earn REZ coins and return to spend them.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl font-black text-indigo-100 mb-4">{item.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
          <p className="mt-3 text-gray-500">No hidden fees. No per-transaction charges on your base plan.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-6 flex flex-col ${
                tier.highlight
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm mt-1 ${tier.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {tier.description}
                </p>
              </div>
              <div className="mb-6">
                <span className={`text-3xl font-black ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {tier.price}
                </span>
                {tier.period && (
                  <span className={`text-sm ${tier.highlight ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {tier.period}
                  </span>
                )}
              </div>
              <ul className="space-y-2.5 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckIcon />
                    <span className={`text-sm ${tier.highlight ? 'text-indigo-100' : 'text-gray-600'}`}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href={tier.ctaHref} className="mt-6 block">
                <Button
                  variant={tier.highlight ? 'primary-white' : 'secondary'}
                  fullWidth
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-gray-900 px-4 py-16 text-center">
        <p className="text-gray-400 text-sm uppercase tracking-widest font-semibold mb-6">
          Trusted by restaurants across India
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-40">
          {['Central Cafe', 'The Bowl', 'Urban Tadka', 'Flavor Mill', 'Green Plate'].map((name) => (
            <span key={name} className="text-white font-bold text-lg">{name}</span>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-6">
          Join 500+ restaurants already on REZ Now &middot; setup in under 30 minutes
        </p>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to grow your restaurant?</h2>
        <p className="text-indigo-200 mb-8 max-w-md mx-auto">
          Get your QR codes and start accepting orders in under 30 minutes. No tech setup required.
        </p>
        <Link href="mailto:grow@rez.money?subject=Join REZ Now — Restaurant Inquiry">
          <Button variant="primary-white" size="lg">
            Apply for early access
          </Button>
        </Link>
        <p className="text-indigo-300 text-sm mt-4">Usually respond within 2 hours</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-4 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} REZ Technologies Pvt. Ltd. &middot;{' '}
          <a href="https://rez.money" className="text-indigo-600 hover:underline">rez.money</a>
        </p>
      </footer>
    </div>
  );
}
