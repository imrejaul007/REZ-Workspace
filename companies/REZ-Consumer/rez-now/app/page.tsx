import type { Metadata } from 'next';
import Link from 'next/link';
import SearchSection from './SearchSection';
import StoreCard from '@/components/store/StoreCard';
import { getFeaturedStores } from '@/lib/api/search';
import type { StoreSearchResult } from '@/lib/api/search';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'REZ Now — Order & Pay at your favourite restaurants',
  description:
    'Scan the QR at your table or counter, browse the menu, pay instantly, and earn REZ coins on every order.',
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-8 h-8" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 14h1m4 0h1M14 18h2m2 2h1M18 14v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-8 h-8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
    </svg>
  );
}

function PayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-8 h-8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function ScanPulseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0" />
    </svg>
  );
}

// ── Step Component ───────────────────────────────────────────────────────────────

interface StepProps {
  icon: React.ReactNode;
  label: string;
  sub: string;
  delay: string;
}

function Step({ icon, label, sub, delay }: StepProps) {
  return (
    <div
      className="flex flex-col items-center gap-3 text-center opacity-0 animate-fade-in-up"
      style={{ animationDelay: delay, animationFillMode: 'forwards' }}
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
          {icon}
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 w-20 h-20 rounded-3xl bg-indigo-400/20 blur-xl -z-10" />
      </div>
      <div>
        <p className="text-base font-bold text-white leading-tight">{label}</p>
        <p className="text-sm text-indigo-200 max-w-[120px] leading-relaxed mt-1">{sub}</p>
      </div>
    </div>
  );
}

// ── Featured Section ────────────────────────────────────────────────────────────

interface FeaturedSectionProps {
  stores: StoreSearchResult[];
}

function FeaturedSection({ stores }: FeaturedSectionProps) {
  if (stores.length === 0) return null;

  return (
    <section className="mt-14" aria-labelledby="featured-heading">
      <div className="text-center mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
        <h2 className="text-2xl font-bold text-gray-900" id="featured-heading">
          Featured Stores
        </h2>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto">
          Handpicked places to order from right now
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stores.map((store, index) => (
          <div
            key={store.id}
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${0.7 + index * 0.1}s`, animationFillMode: 'forwards' }}
          >
            <StoreCard store={store} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Stats Banner ────────────────────────────────────────────────────────────────

function StatsBanner() {
  const stats = [
    { value: '10K+', label: 'Stores' },
    { value: '50K+', label: 'Orders Daily' },
    { value: '4.8', label: 'Rating' },
  ];

  return (
    <div className="flex justify-center gap-8 sm:gap-16 mt-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
      {stats.map((stat, i) => (
        <div key={stat.label} className="text-center">
          <p className="text-2xl sm:text-3xl font-black text-white">{stat.value}</p>
          <p className="text-xs text-indigo-200 font-medium mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  let featured: StoreSearchResult[] = [];
  try {
    featured = await getFeaturedStores();
  } catch {
    // Featured stores are non-critical — silently skip
  }
  featured = featured.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-[family-name:var(--font-inter)]">
      {/* ── Hero ── */}
      <header className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-6 pt-20 pb-24 text-center overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 opacity-20 rounded-full blur-3xl animate-float" aria-hidden="true" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-400 opacity-20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Wordmark */}
          <div className="inline-flex items-center gap-3 mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <span className="text-2xl font-black text-white">R</span>
            </div>
            <div className="text-left">
              <span className="text-3xl font-black tracking-tight text-white block leading-none">REZ Now</span>
              <span className="text-xs font-medium text-indigo-200">Powered by REZ</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            Order &amp; Pay at your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-pink-200">favourite restaurants</span>
          </h1>

          <p className="mt-5 text-lg text-indigo-100 max-w-md mx-auto leading-relaxed opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            Scan the QR at your table — browse the menu, customise your order, and pay in seconds.
          </p>

          {/* Stats */}
          <StatsBanner />

          {/* How it works */}
          <div className="mt-12 flex items-start justify-center gap-6 sm:gap-12">
            <Step
              icon={<QrIcon />}
              label="Scan QR"
              sub="Point your camera at the table QR"
              delay="0.4s"
            />
            <div className="mt-14 text-indigo-300 text-2xl font-light select-none hidden sm:block opacity-0 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }} aria-hidden="true">
              →
            </div>
            <Step
              icon={<MenuIcon />}
              label="Order"
              sub="Browse menu & customise"
              delay="0.5s"
            />
            <div className="mt-14 text-indigo-300 text-2xl font-light select-none hidden sm:block opacity-0 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }} aria-hidden="true">
              →
            </div>
            <Step
              icon={<PayIcon />}
              label="Pay &amp; Track"
              sub="Pay instantly, track live"
              delay="0.6s"
            />
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
            <Link href="/scan">
              <Button
                variant="default"
                size="lg"
                className="group bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <ScanPulseIcon />
                  Scan a QR code
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" aria-hidden="true" />
      </header>

      {/* ── Main Content ── */}
      <main id="main-content" className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Search */}
          <div className="max-w-xl mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Find a store
            </h2>
            <p className="text-gray-500 text-center mt-2">
              Search by name to open their menu directly
            </p>
            <div className="mt-6">
              <SearchSection />
            </div>
          </div>

          {/* Featured */}
          <FeaturedSection stores={featured} />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-black text-white">R</span>
              </div>
              <span className="font-bold text-gray-900">REZ Now</span>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer navigation">
              <Link href="/orders" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                My Orders
              </Link>
              <Link href="/profile" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Profile
              </Link>
              <Link href="/join" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                For Merchants
              </Link>
            </nav>

            {/* Copyright */}
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} REZ. All rights reserved.
            </p>
          </div>

          {/* Powered by */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link
              href="https://rez.money"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <span>Powered by</span>
              <span className="font-semibold text-gray-700">REZ</span>
              <span className="text-gray-400">·</span>
              <span>rez.money</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
