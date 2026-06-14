"use client";

import { useState } from "react";
import Link from "next/link";
import { Percent, Clock, Gift, Zap, CreditCard } from "lucide-react";
import { Deal } from "@shared/types";
import { DEAL_TYPE_LABELS, DEAL_SOURCE_LABELS } from "@shared/constants";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MOCK_DEALS: Deal[] = [
  {
    id: "1",
    title: "50% Off on Biryani",
    slug: "biryani-50-off",
    type: "PERCENTAGE_OFF",
    value: 50,
    applicableTo: "ALL",
    code: "BIRYANI50",
    codeType: "USER_ENTRY",
    source: "REZ",
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    isFeatured: true,
    usedCount: 1250,
    description: "Flat 50% off on all biryani orders",
  },
  {
    id: "2",
    title: "Free Delivery up to ₹100",
    slug: "free-delivery",
    type: "FREE_DELIVERY",
    value: 100,
    applicableTo: "ALL",
    codeType: "AUTO_APPLIED",
    source: "REZ",
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    isActive: true,
    isFeatured: true,
    usedCount: 3400,
    description: "Free delivery on orders above ₹299",
  },
  {
    id: "3",
    title: "Flat ₹200 off on HDFC Cards",
    slug: "hdfc-200-off",
    type: "FLAT_OFF",
    value: 200,
    applicableTo: "ALL",
    codeType: "USER_ENTRY",
    source: "BANK",
    bankName: "HDFC",
    cardType: "credit",
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    isFeatured: true,
    usedCount: 890,
    description: "Use HDFC credit card to get ₹200 off",
  },
  {
    id: "4",
    title: "Buy 1 Get 1 Free Pizza",
    slug: "bogo-pizza",
    type: "BUY_ONE_GET_ONE",
    value: 100,
    applicableTo: "ALL",
    code: "PIZZABOGO",
    codeType: "USER_ENTRY",
    source: "RESTAURANT",
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    isActive: true,
    isFeatured: false,
    usedCount: 567,
    description: "Buy any pizza and get one free",
  },
  {
    id: "5",
    title: "10% Cashback on all orders",
    slug: "cashback-10",
    type: "CASHBACK",
    value: 10,
    applicableTo: "ALL",
    codeType: "AUTO_APPLIED",
    source: "REZ",
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isActive: true,
    isFeatured: false,
    usedCount: 5600,
    description: "Get 10% cashback on every order via ReZ",
  },
];

const DEAL_TYPE_ICONS = {
  PERCENTAGE_OFF: Percent,
  FLAT_OFF: CreditCard,
  FREE_DELIVERY: Gift,
  BUY_ONE_GET_ONE: Zap,
  CASHBACK: Clock,
};

export default function DealsPage() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  const filteredDeals = MOCK_DEALS.filter((deal) => {
    if (activeFilter && deal.type !== activeFilter) return false;
    if (sourceFilter && deal.source !== sourceFilter) return false;
    return true;
  });

  const uniqueTypes = [...new Set(MOCK_DEALS.map((d) => d.type))];
  const uniqueSources = [...new Set(MOCK_DEALS.map((d) => d.source))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-2">🔥 Best Food Deals</h1>
          <p className="text-green-100">
            Save money on every order with exclusive deals
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border p-4 sticky top-20">
              <h3 className="font-semibold mb-4">Filter by Type</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveFilter(null)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    !activeFilter ? "bg-orange-100 text-orange-700" : "hover:bg-gray-50"
                  )}
                >
                  All Deals
                </button>
                {uniqueTypes.map((type) => {
                  const Icon = DEAL_TYPE_ICONS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveFilter(activeFilter === type ? null : type)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors",
                        activeFilter === type ? "bg-orange-100 text-orange-700" : "hover:bg-gray-50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {DEAL_TYPE_LABELS[type]}
                    </button>
                  );
                })}
              </div>

              <h3 className="font-semibold mb-4 mt-6">Filter by Source</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSourceFilter(null)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    !sourceFilter ? "bg-orange-100 text-orange-700" : "hover:bg-gray-50"
                  )}
                >
                  All Sources
                </button>
                {uniqueSources.map((source) => (
                  <button
                    key={source}
                    onClick={() => setSourceFilter(sourceFilter === source ? null : source)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      sourceFilter === source ? "bg-orange-100 text-orange-700" : "hover:bg-gray-50"
                    )}
                  >
                    {DEAL_SOURCE_LABELS[source]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deals List */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {filteredDeals.length} deals found
              </p>
            </div>

            <div className="space-y-4">
              {filteredDeals.map((deal) => {
                const Icon = DEAL_TYPE_ICONS[deal.type];
                return (
                  <div
                    key={deal.id}
                    className="bg-white rounded-xl border hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="p-3 bg-green-100 rounded-xl">
                          <Icon className="w-6 h-6 text-green-600" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-green-600 text-lg">
                                  {deal.type === "PERCENTAGE_OFF"
                                    ? `${deal.value}% OFF`
                                    : deal.type === "FLAT_OFF"
                                    ? `₹${deal.value} OFF`
                                    : deal.type === "FREE_DELIVERY"
                                    ? "FREE DELIVERY"
                                    : deal.type === "BUY_ONE_GET_ONE"
                                    ? "BOGO"
                                    : `${deal.value}% CASHBACK`}
                                </span>
                                {deal.source === "BANK" && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    {deal.bankName}
                                  </span>
                                )}
                                {deal.isFeatured && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                    ⭐ Featured
                                  </span>
                                )}
                              </div>
                              <h3 className="font-semibold mt-1">{deal.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">{deal.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {deal.usedCount.toLocaleString()} used
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                Expires {timeAgo(deal.endsAt)}
                              </p>
                            </div>
                          </div>

                          {/* Code */}
                          {deal.code && (
                            <div className="mt-4 flex items-center gap-3">
                              <div className="flex-1 px-4 py-2 bg-gray-100 rounded-lg font-mono text-sm">
                                {deal.code}
                              </div>
                              <Button size="sm">Copy</Button>
                            </div>
                          )}

                          {/* Auto Applied */}
                          {deal.codeType === "AUTO_APPLIED" && (
                            <div className="mt-4 text-sm text-green-600">
                              ✓ Automatically applied at checkout via ReZ
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
