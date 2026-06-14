'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { getCategoryBySlug, getAgentsByCategory } from '@/data/agents';
import AgentCard from '@/components/Catalog/AgentCard';

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;

  const { setSelectedCategory } = useMarketplaceStore();

  const category = getCategoryBySlug(categorySlug);
  const agents = getAgentsByCategory(categorySlug);

  useEffect(() => {
    setSelectedCategory(categorySlug);
    return () => setSelectedCategory(null);
  }, [categorySlug, setSelectedCategory]);

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Category not found</h1>
          <Link href="/" className="text-blue-600 hover:underline">Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{category.name}</h1>
                  <p className="text-xs text-gray-500">{agents.length} agents available</p>
                </div>
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Browse All
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Description */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
              {category.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h2>
              <p className="text-gray-600">{category.description}</p>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              All {category.name} Agents
            </h3>
            <span className="text-sm text-gray-500">{agents.length} agents</span>
          </div>

          {agents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No agents in this category yet</h4>
              <p className="text-gray-500">Check back soon for new agents</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </section>

        {/* Other Categories */}
        <section className="mt-16">
          <h3 className="text-lg font-semibold mb-6">Explore Other Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Will be rendered from data */}
          </div>
        </section>
      </main>
    </div>
  );
}