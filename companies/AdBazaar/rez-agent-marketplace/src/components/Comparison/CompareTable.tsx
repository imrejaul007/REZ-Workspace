'use client';

import { Agent } from '@/types/agent';
import { Check, X, Star } from 'lucide-react';

interface CompareTableProps {
  agents: Agent[];
}

export default function CompareTable({ agents }: CompareTableProps) {
  // Get all unique features
  const allFeatures = [...new Set(agents.flatMap(a => a.features.map(f => f.id)))];

  // Get all capabilities
  const allCapabilities = [...new Set(agents.flatMap(a => a.capabilities))];

  // Get all integrations
  const allIntegrations = [...new Set(agents.flatMap(a => a.integrations))];

  const hasFeature = (agent: Agent, featureId: string) => {
    return agent.features.find(f => f.id === featureId)?.included ?? false;
  };

  const hasCapability = (agent: Agent, capability: string) => {
    return agent.capabilities.includes(capability);
  };

  const hasIntegration = (agent: Agent, integration: string) => {
    return agent.integrations.includes(integration);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-4 bg-gray-50 font-semibold text-gray-700 w-48">
                Feature
              </th>
              {agents.map((agent) => (
                <th key={agent.id} className="p-4 text-center min-w-48 bg-gray-50">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl mb-2">{agent.icon}</span>
                    <span className="font-semibold text-gray-900">{agent.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Rating & Price */}
            <tr className="border-b border-gray-100">
              <td className="p-4 text-gray-600">Rating</td>
              {agents.map((agent) => (
                <td key={agent.id} className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-semibold">{agent.rating.toFixed(1)}</span>
                  </div>
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-100">
              <td className="p-4 text-gray-600">Starting Price</td>
              {agents.map((agent) => (
                <td key={agent.id} className="p-4 text-center">
                  <span className="font-bold text-lg">
                    {agent.price === 0 ? 'Free' : `$${agent.price}`}
                  </span>
                  {agent.price > 0 && (
                    <span className="text-gray-500 text-sm">/mo</span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-100">
              <td className="p-4 text-gray-600">Installs</td>
              {agents.map((agent) => (
                <td key={agent.id} className="p-4 text-center">
                  {agent.installCount.toLocaleString()}
                </td>
              ))}
            </tr>

            {/* Section Header: Features */}
            <tr className="bg-blue-50">
              <td colSpan={agents.length + 1} className="p-3 font-semibold text-blue-700">
                Features
              </td>
            </tr>
            {agents[0]?.features.map((feature) => (
              <tr key={feature.id} className="border-b border-gray-100">
                <td className="p-4 text-gray-700">
                  <div>
                    <p className="font-medium">{feature.name}</p>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </td>
                {agents.map((agent) => (
                  <td key={agent.id} className="p-4 text-center">
                    {hasFeature(agent, feature.id) ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Section Header: Capabilities */}
            <tr className="bg-purple-50">
              <td colSpan={agents.length + 1} className="p-3 font-semibold text-purple-700">
                Capabilities
              </td>
            </tr>
            {allCapabilities.slice(0, 10).map((capability) => (
              <tr key={capability} className="border-b border-gray-100">
                <td className="p-4 text-gray-700">{capability}</td>
                {agents.map((agent) => (
                  <td key={agent.id} className="p-4 text-center">
                    {hasCapability(agent, capability) ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Section Header: Integrations */}
            <tr className="bg-green-50">
              <td colSpan={agents.length + 1} className="p-3 font-semibold text-green-700">
                Integrations
              </td>
            </tr>
            {allIntegrations.map((integration) => (
              <tr key={integration} className="border-b border-gray-100">
                <td className="p-4 text-gray-700">{integration}</td>
                {agents.map((agent) => (
                  <td key={agent.id} className="p-4 text-center">
                    {hasIntegration(agent, integration) ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Action Row */}
            <tr>
              <td className="p-4"></td>
              {agents.map((agent) => (
                <td key={agent.id} className="p-4 text-center">
                  <a
                    href={`/agent/${agent.id}`}
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}