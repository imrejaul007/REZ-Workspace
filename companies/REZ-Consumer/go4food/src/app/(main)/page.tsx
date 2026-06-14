"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, TrendingUp, Percent, ChefHat, MessageCircle, MapPin } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";
import { TrendingSearches } from "@/components/search/trending-searches";
import { FeaturedDeals } from "@/components/deals/featured-deals";
import { FoodAdvisorPreview } from "@/components/advisor/food-advisor-preview";
import { CuisineGrid } from "@/components/ui/cuisine-grid";

const FEATURES = [
  {
    icon: Search,
    title: "Smart Search",
    description: "Natural language search: 'biryani under 300 near me'",
    href: "/search",
  },
  {
    icon: TrendingUp,
    title: "Price Compare",
    description: "See real prices across Swiggy, Zomato & ReZ",
    href: "/compare",
  },
  {
    icon: Percent,
    title: "Best Deals",
    description: "All coupons in one place, auto-applied",
    href: "/deals",
  },
  {
    icon: ChefHat,
    title: "Dishpedia",
    description: "Every dish rated, explained, traced",
    href: "/dish",
  },
  {
    icon: MessageCircle,
    title: "AI Advisor",
    description: "Ask 'what should I eat?' and get answers",
    href: "/advisor",
  },
  {
    icon: MapPin,
    title: "Food Community",
    description: "Join city food groups, share discoveries",
    href: "/community",
  },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-400 to-orange-300 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Before You Order,
            <br />
            <span className="text-yellow-200">Check Here</span>
          </h1>
          <p className="text-lg md:text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            India&apos;s Food Decision Engine. Compare prices, find deals, and make smarter food choices.
          </p>

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search for 'Biryani under 300' or 'Best pizza near me'"
            size="large"
            className="max-w-2xl mx-auto"
          />

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mt-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-orange-100">Restaurants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">50K+</div>
              <div className="text-orange-100">Dishes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">5K+</div>
              <div className="text-orange-100">Active Deals</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Everything You Need to Decide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all"
              >
                <feature.icon className="w-10 h-10 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg mb-2 group-hover:text-orange-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Searches */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <TrendingSearches />
        </div>
      </section>

      {/* Featured Deals */}
      <section className="py-12 px-4 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🔥 Hot Deals</h2>
            <Link href="/deals" className="text-orange-600 hover:text-orange-700 font-medium">
              View All →
            </Link>
          </div>
          <FeaturedDeals />
        </div>
      </section>

      {/* AI Advisor Preview */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <FoodAdvisorPreview />
        </div>
      </section>

      {/* Cuisine Grid */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Explore by Cuisine</h2>
          <CuisineGrid />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-orange-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Make Smarter Food Decisions
          </h2>
          <p className="text-orange-100 mb-8 text-lg">
            Stop guessing. Start comparing. Save money on every order.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="px-8 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Search Food
            </Link>
            <Link
              href="/deals"
              className="px-8 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Browse Deals
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
