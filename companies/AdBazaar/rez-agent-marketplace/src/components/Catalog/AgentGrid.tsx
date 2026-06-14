'use client';

import { Agent } from '@/types/agent';
import AgentCard from './AgentCard';
import { useMarketplaceStore } from '@/store/marketplaceStore';

interface AgentGridProps {
  agents: Agent[];
}

export default function AgentGrid({ agents }: AgentGridProps) {
  const { viewMode } = useMarketplaceStore();

  if (agents.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">No agents found</h4>
        <p className="text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className={
      viewMode === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'flex flex-col gap-4'
    }>
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} viewMode={viewMode} />
      ))}
    </div>
  );
}
