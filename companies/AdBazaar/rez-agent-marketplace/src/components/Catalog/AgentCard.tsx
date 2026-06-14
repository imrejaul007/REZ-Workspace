'use client';

import Link from 'next/link';
import { Star, Download, ArrowRight } from 'lucide-react';
import { Agent } from '@/types/agent';
import { useMarketplaceStore } from '@/store/marketplaceStore';

interface AgentCardProps {
  agent: Agent;
  viewMode?: 'grid' | 'list';
}

export default function AgentCard({ agent, viewMode = 'grid' }: AgentCardProps) {
  const { addToCompare, compareList, startInstallation } = useMarketplaceStore();
  const isInCompare = compareList.includes(agent.id);

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCompare) {
      useMarketplaceStore.getState().removeFromCompare(agent.id);
    } else {
      addToCompare(agent.id);
    }
  };

  const handleInstall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startInstallation(agent);
  };

  if (viewMode === 'list') {
    return (
      <Link href={`/agent/${agent.id}`}>
        <div className="agent-card p-4 flex items-center gap-6">
          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-3xl">
            {agent.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{agent.name}</h3>
              <span className={`badge ${agent.price === 0 ? 'badge-free' : 'badge-paid'}`}>
                {agent.price === 0 ? 'Free' : `$${agent.price}/mo`}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-1">{agent.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {agent.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                {agent.installCount.toLocaleString()}
              </span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{agent.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCompare}
              className={`compare-btn text-sm ${isInCompare ? 'active' : ''}`}
            >
              {isInCompare ? 'Remove' : 'Compare'}
            </button>
            <button onClick={handleInstall} className="install-btn text-sm">
              Install
            </button>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/agent/${agent.id}`}>
      <div className="agent-card p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
            {agent.icon}
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${agent.price === 0 ? 'badge-free' : 'badge-paid'}`}>
              {agent.price === 0 ? 'Free' : `$${agent.price}/mo`}
            </span>
            {agent.installCount > 10000 && (
              <span className="badge badge-popular">Popular</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{agent.name}</h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{agent.description}</p>

          {/* Capabilities preview */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {agent.capabilities.slice(0, 3).map((cap, index) => (
              <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {cap.split(' ').slice(0, 2).join(' ')}
              </span>
            ))}
            {agent.capabilities.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{agent.capabilities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {agent.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                {agent.installCount >= 1000
                  ? `${(agent.installCount / 1000).toFixed(1)}K`
                  : agent.installCount}
              </span>
            </div>
            <span className="text-xs text-gray-400">{agent.category}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCompare}
              className={`flex-1 compare-btn text-sm ${isInCompare ? 'active' : ''}`}
            >
              {isInCompare ? 'In Compare' : 'Compare'}
            </button>
            <button onClick={handleInstall} className="flex-1 install-btn text-sm">
              Install
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
