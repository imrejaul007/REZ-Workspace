"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, User, Heart, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/search/search-bar";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/deals", label: "Deals" },
  { href: "/community", label: "Community" },
  { href: "/advisor", label: "AI Advisor" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:block">Go4Food</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-orange-600 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Desktop Search */}
            <div className="hidden md:block w-64">
              <SearchBar placeholder="Search..." />
            </div>

            {/* User Actions */}
            <div className="hidden md:flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <Heart className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                  5
                </span>
              </button>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="py-3 md:hidden border-t">
            <SearchBar placeholder="Search for food..." autoFocus />
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="py-4 border-t md:hidden">
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2" />
              <Link
                href="/profile"
                className="px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                My Profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
