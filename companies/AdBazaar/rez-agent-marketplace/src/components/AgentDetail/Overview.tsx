'use client';

import { Agent } from '@/types/agent';
import { FileText, MessageSquare, BarChart3 } from 'lucide-react';

interface OverviewProps {
  agent: Agent;
}

export default function Overview({ agent }: OverviewProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-500" />
        About {agent.name}
      </h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        {agent.longDescription}
      </p>

      {/* Capabilities List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Key Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agent.capabilities.map((capability, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">{capability}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{agent.installCount.toLocaleString()}+</p>
          <p className="text-sm text-gray-500">Active Installations</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{agent.rating.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Average Rating</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{agent.reviews.length}</p>
          <p className="text-sm text-gray-500">Reviews</p>
        </div>
      </div>
    </div>
  );
}
