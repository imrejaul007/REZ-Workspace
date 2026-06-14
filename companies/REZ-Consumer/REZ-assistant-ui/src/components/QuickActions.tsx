"use client";

import { MapPin, Percent, Sparkles, Headphones, Search, ShoppingBag, Truck } from "lucide-react";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const quickActions = [
  {
    id: "track",
    label: "Track Order",
    icon: Truck,
    description: "Check your delivery status",
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
  },
  {
    id: "deals",
    label: "Today's Deals",
    icon: Percent,
    description: "View active offers",
    color: "bg-green-50 text-green-600 hover:bg-green-100",
  },
  {
    id: "recommend",
    label: "For You",
    icon: Sparkles,
    description: "Personalized picks",
    color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
  },
  {
    id: "support",
    label: "Help",
    icon: Headphones,
    description: "Get support",
    color: "bg-orange-50 text-orange-600 hover:bg-orange-100",
  },
];

const suggestedSearches = [
  { label: "Wireless Headphones", icon: Search },
  { label: "Running Shoes", icon: ShoppingBag },
  { label: "Find stores near me", icon: MapPin },
];

export default function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className={`group flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all ${action.color}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm group-hover:shadow-md">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs opacity-70">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Suggested Searches */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-surface-600">
          Popular Searches
        </h3>
        <div className="flex flex-wrap gap-2">
          {suggestedSearches.map((search) => {
            const Icon = search.icon;
            return (
              <button
                key={search.label}
                onClick={() => onAction(search.label)}
                className="flex items-center gap-2 rounded-full border border-surface-200 bg-white px-4 py-2 text-sm text-surface-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
              >
                <Icon className="h-3.5 w-3.5" />
                {search.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Categories */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-surface-600">
          Browse Categories
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin hide-scrollbar">
          {[
            "Electronics",
            "Fashion",
            "Home & Garden",
            "Sports",
            "Beauty",
            "Books",
            "Toys",
            "Food & Drinks",
          ].map((category) => (
            <button
              key={category}
              onClick={() => onAction(`Browse ${category}`)}
              className="whitespace-nowrap rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm text-surface-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
