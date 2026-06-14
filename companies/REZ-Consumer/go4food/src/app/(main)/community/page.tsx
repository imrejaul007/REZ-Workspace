"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, MapPin, Utensils, TrendingUp } from "lucide-react";
import { FoodGroup } from "@shared/types";
import { GROUP_TYPE_LABELS } from "@shared/constants";
import { cn } from "@/lib/utils";

const MOCK_GROUPS: FoodGroup[] = [
  {
    id: "1",
    name: "Bangalore Foodies",
    slug: "bangalore-foodies",
    description: "The ultimate community for Bangalore food lovers",
    type: "CITY",
    city: "Bangalore",
    memberCount: 15420,
    postCount: 3420,
    isPrivate: false,
    isMember: true,
  },
  {
    id: "2",
    name: "Biryani Lovers",
    slug: "biryani-lovers",
    description: "For those who believe biryani is life",
    type: "CUISINE",
    memberCount: 28300,
    postCount: 5670,
    isPrivate: false,
    isMember: true,
  },
  {
    id: "3",
    name: "Healthy Eating India",
    slug: "healthy-eating-india",
    description: "Clean eating, macros, and nutrition discussions",
    type: "LIFESTYLE",
    memberCount: 8900,
    postCount: 1230,
    isPrivate: false,
    isMember: false,
  },
  {
    id: "4",
    name: "Hyderabad Foodies",
    slug: "hyderabad-foodies",
    description: "Discover the best of Hyderabad cuisine",
    type: "CITY",
    city: "Hyderabad",
    memberCount: 12100,
    postCount: 2890,
    isPrivate: false,
    isMember: false,
  },
  {
    id: "5",
    name: "Pizza & Pasta India",
    slug: "pizza-pasta-india",
    description: "Everything about Italian food in India",
    type: "CUISINE",
    memberCount: 15600,
    postCount: 4100,
    isPrivate: false,
    isMember: true,
  },
  {
    id: "6",
    name: "Street Food Hunters",
    slug: "street-food-hunters",
    description: "Finding the best street food across India",
    type: "GENERAL",
    memberCount: 19800,
    postCount: 5670,
    isPrivate: false,
    isMember: false,
  },
];

const TYPE_ICONS = {
  CITY: MapPin,
  CUISINE: Utensils,
  LIFESTYLE: TrendingUp,
  GENERAL: Users,
};

export default function CommunityPage() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [showJoined, setShowJoined] = useState(false);

  const filteredGroups = MOCK_GROUPS.filter((group) => {
    if (showJoined && !group.isMember) return false;
    if (activeType && group.type !== activeType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-2">🍽️ Food Communities</h1>
          <p className="text-purple-100">
            Join groups, share discoveries, and connect with food lovers
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoined(!showJoined)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                showJoined
                  ? "bg-purple-600 text-white"
                  : "bg-white border text-gray-600 hover:border-purple-300"
              )}
            >
              My Groups
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveType(null)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                !activeType
                  ? "bg-purple-600 text-white"
                  : "bg-white border text-gray-600 hover:border-purple-300"
              )}
            >
              All
            </button>
            {["CITY", "CUISINE", "LIFESTYLE", "GENERAL"].map((type) => {
              const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS];
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(activeType === type ? null : type)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                    activeType === type
                      ? "bg-purple-600 text-white"
                      : "bg-white border text-gray-600 hover:border-purple-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {GROUP_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => {
            const Icon = TYPE_ICONS[group.type];
            return (
              <Link
                key={group.id}
                href={`/community/${group.slug}`}
                className="group bg-white rounded-xl border hover:shadow-lg hover:border-purple-200 transition-all overflow-hidden"
              >
                {/* Cover */}
                <div className="h-24 bg-gradient-to-r from-purple-400 to-pink-400 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-12 h-12 text-white/50" />
                  </div>
                  {group.isMember && (
                    <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      Member
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                      {GROUP_TYPE_LABELS[group.type]}
                    </span>
                    {group.city && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {group.city}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-lg group-hover:text-purple-600 transition-colors">
                    {group.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {group.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.memberCount.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Utensils className="w-4 h-4" />
                      {group.postCount.toLocaleString()} posts
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No groups found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
