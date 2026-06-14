'use client';

import { useState, useEffect } from 'react';

interface WarrantyPlan {
  plan_id: string;
  name: string;
  description: string;
  tier: string;
  duration_months: number;
  price: number;
  coverage: {
    manufacturing_defects: boolean;
    accidental_damage: boolean;
    liquid_damage: boolean;
    theft_protection: boolean;
    pickup_delivery: boolean;
    express_service: boolean;
    unlimited_claims: boolean;
  };
  benefits: {
    cashback_percentage: number;
    loyalty_points_multiplier: number;
    priority_support: boolean;
  };
  limits: {
    max_claim_amount: number;
    max_total_claims: number;
    deductible: number;
  };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<WarrantyPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPlans(getMockPlans());
    setLoading(false);
  }, []);

  const getMockPlans = (): WarrantyPlan[] => [
    {
      plan_id: 'PLAN-BASIC',
      name: 'Basic Protection',
      description: 'Essential coverage for manufacturing defects',
      tier: 'basic',
      duration_months: 12,
      price: 499,
      coverage: {
        manufacturing_defects: true,
        accidental_damage: false,
        liquid_damage: false,
        theft_protection: false,
        pickup_delivery: false,
        express_service: false,
        unlimited_claims: false,
      },
      benefits: {
        cashback_percentage: 0,
        loyalty_points_multiplier: 1,
        priority_support: false,
      },
      limits: {
        max_claim_amount: 5000,
        max_total_claims: 2,
        deductible: 500,
      },
    },
    {
      plan_id: 'PLAN-STANDARD',
      name: 'Standard Protection',
      description: 'Enhanced coverage including accidental damage',
      tier: 'standard',
      duration_months: 12,
      price: 999,
      coverage: {
        manufacturing_defects: true,
        accidental_damage: true,
        liquid_damage: false,
        theft_protection: false,
        pickup_delivery: false,
        express_service: false,
        unlimited_claims: false,
      },
      benefits: {
        cashback_percentage: 1,
        loyalty_points_multiplier: 1.5,
        priority_support: false,
      },
      limits: {
        max_claim_amount: 10000,
        max_total_claims: 3,
        deductible: 300,
      },
    },
    {
      plan_id: 'PLAN-PREMIUM',
      name: 'Premium Protection',
      description: 'Full coverage with express service',
      tier: 'premium',
      duration_months: 24,
      price: 1999,
      coverage: {
        manufacturing_defects: true,
        accidental_damage: true,
        liquid_damage: true,
        theft_protection: false,
        pickup_delivery: true,
        express_service: true,
        unlimited_claims: false,
      },
      benefits: {
        cashback_percentage: 2,
        loyalty_points_multiplier: 2,
        priority_support: true,
      },
      limits: {
        max_claim_amount: 20000,
        max_total_claims: 5,
        deductible: 200,
      },
    },
    {
      plan_id: 'PLAN-COMPREHENSIVE',
      name: 'Comprehensive Protection',
      description: 'Ultimate coverage including theft protection',
      tier: 'comprehensive',
      duration_months: 36,
      price: 2999,
      coverage: {
        manufacturing_defects: true,
        accidental_damage: true,
        liquid_damage: true,
        theft_protection: true,
        pickup_delivery: true,
        express_service: true,
        unlimited_claims: true,
      },
      benefits: {
        cashback_percentage: 3,
        loyalty_points_multiplier: 3,
        priority_support: true,
      },
      limits: {
        max_claim_amount: 50000,
        max_total_claims: 999,
        deductible: 0,
      },
    },
  ];

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'basic':
        return { gradient: 'from-gray-400 to-gray-500', badge: 'bg-gray-100 text-gray-700', popular: false };
      case 'standard':
        return { gradient: 'from-blue-400 to-blue-600', badge: 'bg-blue-100 text-blue-700', popular: false };
      case 'premium':
        return { gradient: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 text-violet-700', popular: true };
      case 'comprehensive':
        return { gradient: 'from-amber-400 to-orange-500', badge: 'bg-amber-100 text-amber-700', popular: false };
      default:
        return { gradient: 'from-gray-400 to-gray-500', badge: 'bg-gray-100 text-gray-700', popular: false };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-8 mb-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative text-center py-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Extended Warranty Plans
          </h1>
          <p className="text-orange-100 text-lg max-w-2xl mx-auto">
            Protect your products with comprehensive coverage plans. From basic protection to complete peace of mind.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-gray-200 w-fit">
        {['plans', 'subscriptions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab === 'plans' ? 'Available Plans' : 'My Subscriptions'}
          </button>
        ))}
      </div>

      {/* Plans Grid */}
      {activeTab === 'plans' && (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, i) => {
            const config = getTierConfig(plan.tier);
            return (
              <div
                key={plan.plan_id}
                className={`relative overflow-hidden rounded-2xl bg-white border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  config.popular ? 'border-amber-400 shadow-xl shadow-amber-500/10' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {config.popular && (
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-b-lg shadow-lg">
                      ⭐ MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className={`bg-gradient-to-r ${config.gradient} p-5 ${config.popular ? 'pt-8' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white capitalize`}>
                      {plan.tier}
                    </span>
                    <span className="text-white/80 text-sm">
                      {plan.duration_months} months
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-white/80 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500">/plan</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    ₹{Math.round(plan.price / plan.duration_months)}/month
                  </p>
                </div>

                {/* Coverage */}
                <div className="p-5 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Coverage</p>
                  <div className="space-y-2">
                    {Object.entries(plan.coverage).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        {value ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                        <span className={`text-sm capitalize ${value ? 'text-gray-700' : 'text-gray-400'}`}>
                          {key.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div className="px-5 pb-5">
                  <div className="flex flex-wrap gap-2">
                    {plan.benefits.cashback_percentage > 0 && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg">
                        {plan.benefits.cashback_percentage}% Cashback
                      </span>
                    )}
                    {plan.benefits.priority_support && (
                      <span className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-lg">
                        Priority Support
                      </span>
                    )}
                    {plan.limits.unlimited_claims && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg">
                        Unlimited Claims
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="p-5 pt-0">
                  <button
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      config.popular
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/30'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Subscribe Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscriptions</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You don't have unknown active warranty subscriptions. Choose a plan above to protect your products.
          </p>
          <button
            onClick={() => setActiveTab('plans')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
          >
            Browse Plans
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      )}

      {/* Comparison Section */}
      <div className="mt-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Why Extended Warranty?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🛡️',
              title: 'Complete Protection',
              description: 'Cover manufacturing defects, accidental damage, and more',
            },
            {
              icon: '⚡',
              title: 'Express Service',
              description: 'Get priority repairs and replacements with express service',
            },
            {
              icon: '💰',
              title: 'Cashback Rewards',
              description: 'Earn up to 3% cashback on claim payouts',
            },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
