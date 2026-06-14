'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, X, Plus } from 'lucide-react';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { getAgentById } from '@/data/agents';
import CompareTable from '@/components/Comparison/CompareTable';

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useMarketplaceStore();

  const agents = compareList.map(id => getAgentById(id)).filter(Boolean);

  const handleRemove = (agentId: string) => {
    removeFromCompare(agentId);
  };

  const handleClear = () => {
    clearCompare();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                <h1 className="text-lg font-bold">Compare Agents</h1>
              </div>
            </div>
            {compareList.length > 0 && (
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {agents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No agents selected</h2>
            <p className="text-gray-500 mb-6">Add agents to compare their features and pricing</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Browse Agents
            </Link>
          </div>
        ) : (
          <>
            {/* Agent Cards */}
            <div className="flex gap-4 overflow-x-auto pb-4 mb-8">
              {agents.map((agent) => (
                <div
                  key={agent!.id}
                  className="flex-shrink-0 w-64 bg-white rounded-xl border border-gray-200 p-4 relative"
                >
                  <button
                    onClick={() => handleRemove(agent!.id)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl mb-3">
                    {agent!.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{agent!.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{agent!.category}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="text-amber-500">★</span>
                      {agent!.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      {agent!.installCount.toLocaleString()} installs
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className={`badge ${agent!.price === 0 ? 'badge-free' : 'badge-paid'}`}>
                      {agent!.price === 0 ? 'Free' : `$${agent!.price}/mo`}
                    </span>
                  </div>
                </div>
              ))}

              {/* Add More Card */}
              {agents.length < 4 && (
                <Link
                  href="/"
                  className="flex-shrink-0 w-64 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="text-sm">Add Agent</span>
                </Link>
              )}
            </div>

            {/* Comparison Table */}
            <CompareTable agents={agents} />
          </>
        )}
      </main>
    </div>
  );
}