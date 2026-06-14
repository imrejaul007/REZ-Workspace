'use client';

import { Agent, Feature } from '@/types/agent';
import { Settings, Check, X } from 'lucide-react';

interface FeaturesProps {
  agent: Agent;
}

export default function Features({ agent }: FeaturesProps) {
  const includedFeatures = agent.features.filter(f => f.included);
  const excludedFeatures = agent.features.filter(f => !f.included);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5 text-purple-500" />
        Feature Comparison
      </h2>

      {/* Included Features */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Included Features
        </h3>
        <div className="space-y-3">
          {includedFeatures.map((feature) => (
            <div key={feature.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{feature.name}</p>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Features */}
      {excludedFeatures.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Premium Features (Upgrade Required)
          </h3>
          <div className="space-y-3">
            {excludedFeatures.map((feature) => (
              <div key={feature.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-700">{feature.name}</p>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
