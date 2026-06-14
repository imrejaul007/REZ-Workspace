'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Leaf,
  Compass,
  Flag,
  Trophy,
  Wallet,
  Users,
  Home,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/karma/home', label: 'Home', icon: Home },
  { href: '/karma/explore', label: 'Explore', icon: Compass },
  { href: '/karma/missions', label: 'Missions', icon: Flag },
  { href: '/karma/leaderboard', label: 'Rankings', icon: Trophy },
  { href: '/karma/wallet', label: 'ReZ Coins', icon: Wallet },
  { href: '/karma/communities', label: 'Communities', icon: Users },
  { href: '/karma/corporate', label: 'CorpPerks', icon: Building2 },
];

export function KarmaNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      {/* Top bar with gradient */}
      <div className="bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/karma/home" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none block">Karma</span>
              <span className="text-white/70 text-xs leading-none">Do Good. Earn More.</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/karma/my-karma"
              className="text-white/90 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              My Karma
            </Link>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-[#F5F3FF] text-[#8B5CF6]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
