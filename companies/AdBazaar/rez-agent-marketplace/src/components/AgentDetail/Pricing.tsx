'use client';

import { Agent } from '@/types/agent';
import { Check, Sparkles } from 'lucide-react';

interface PricingProps {
  agent: Agent;
  onInstall: () => void;
}

export default function Pricing({ agent, onInstall }: PricingProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        Pricing Plans
      </h2>

      <div className="space-y-4">
        {agent.pricingPlans.map((plan) => (
          <div
            key={plan.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              plan.recommended
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {plan.recommended && (
              <div className="flex items-center gap-1 text-xs font-medium text-blue-600 mb-2">
                <Sparkles className="w-3 h-3" />
                Recommended
              </div>
            )}

            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-bold">
                {plan.price === 0 ? 'Free' : `$${plan.price}`}
              </span>
              {plan.price > 0 && (
                <span className="text-gray-500">/{plan.period}</span>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">{plan.name}</h3>

            <ul className="space-y-2 mb-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={onInstall}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                plan.recommended
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Start with {plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
