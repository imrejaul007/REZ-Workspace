'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, Download, Check, Zap, MessageSquare, Settings, BarChart3, Shield, Globe, ChevronRight } from 'lucide-react';
import { getAgentById } from '@/data/agents';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import Overview from '@/components/AgentDetail/Overview';
import Features from '@/components/AgentDetail/Features';
import Pricing from '@/components/AgentDetail/Pricing';
import Reviews from '@/components/AgentDetail/Reviews';

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const agent = getAgentById(agentId);
  const { addToCompare, compareList, startInstallation } = useMarketplaceStore();

  const isInCompare = compareList.includes(agentId);

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent not found</h1>
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
                <span className="text-2xl">{agent.icon}</span>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{agent.name}</h1>
                  <p className="text-xs text-gray-500">{agent.category}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isInCompare) {
                    useMarketplaceStore.getState().removeFromCompare(agentId);
                  } else {
                    addToCompare(agentId);
                  }
                }}
                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  isInCompare
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:border-blue-500'
                }`}
              >
                {isInCompare ? 'In Compare' : 'Add to Compare'}
              </button>
              <button
                onClick={() => startInstallation(agent)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Install Agent
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Rating
            </div>
            <p className="text-2xl font-bold">{agent.rating.toFixed(1)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Download className="w-4 h-4" />
              Installs
            </div>
            <p className="text-2xl font-bold">{agent.installCount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Zap className="w-4 h-4 text-blue-500" />
              Capabilities
            </div>
            <p className="text-2xl font-bold">{agent.capabilities.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Globe className="w-4 h-4" />
              Integrations
            </div>
            <p className="text-2xl font-bold">{agent.integrations.length}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Overview agent={agent} />
            <Features agent={agent} />
            <Reviews reviews={agent.reviews} />
          </div>

          {/* Right Column - Pricing & Actions */}
          <div className="space-y-6">
            <Pricing agent={agent} onInstall={() => startInstallation(agent)} />

            {/* Integrations */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Integrations
              </h3>
              <div className="flex flex-wrap gap-2">
                {agent.integrations.map((integration) => (
                  <span key={integration} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                    {integration}
                  </span>
                ))}
              </div>
            </div>

            {/* Capabilities */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                Tasks & Automations
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Tasks</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.tasks.map((task) => (
                      <span key={task} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
                        {task}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Automations</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.automations.slice(0, 4).map((automation) => (
                      <span key={automation} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                        {automation}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}