'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Search, Grid3X3, List, SlidersHorizontal, Star, Download, TrendingUp, Sparkles } from 'lucide-react';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { categories, getFeaturedAgents, getTopRatedAgents, getFreeAgents } from '@/data/agents';
import AgentCard from '@/components/Catalog/AgentCard';
import CategoryFilter from '@/components/Catalog/CategoryFilter';
import SearchBar from '@/components/Catalog/SearchBar';

export default function HomePage() {
  const {
    filteredAgents,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    priceFilter,
    setPriceFilter,
    selectedCategory,
  } = useMarketplaceStore();

  const featuredAgents = getFeaturedAgents();
  const topRatedAgents = getTopRatedAgents();
  const freeAgents = getFreeAgents();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ReZ Agent Marketplace</h1>
                <p className="text-xs text-gray-500">AI Agents for Every Business</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-blue-600">Browse Agents</Link>
              <Link href="/compare" className="text-sm font-medium text-gray-600 hover:text-gray-900">Compare</Link>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Transform Your Business with AI Agents
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Discover 15+ industry-specific AI agents designed to automate operations,
            boost efficiency, and enhance customer experiences.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium">4.8 Average Rating</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">100K+ Installations</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">15+ Industries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <SearchBar />

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <CategoryFilter />

            <div className="flex items-center gap-3 ml-auto">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="filter-select"
              >
                <option value="all">All Prices</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="filter-select"
              >
                <option value="rating">Top Rated</option>
                <option value="installs">Most Installed</option>
                <option value="name">Name A-Z</option>
                <option value="price">Price</option>
              </select>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Agents */}
        {!selectedCategory && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-semibold">Featured Agents</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        )}

        {/* All Agents Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              {selectedCategory
                ? `${categories.find(c => c.slug === selectedCategory)?.name} Agents`
                : 'All Agents'
              }
            </h3>
            <span className="text-sm text-gray-500">{filteredAgents.length} agents</span>
          </div>

          {filteredAgents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No agents found</h4>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-4'
            }>
              {filteredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} viewMode={viewMode} />
              ))}
            </div>
          )}
        </section>

        {/* Free Agents Section */}
        {!selectedCategory && (
          <section className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">$</span>
              </div>
              <h3 className="text-xl font-semibold">Free Agents</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freeAgents.slice(0, 3).map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">ReZ Agent Marketplace</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 AdBazaar Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}