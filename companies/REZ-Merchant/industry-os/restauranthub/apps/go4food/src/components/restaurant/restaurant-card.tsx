"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Clock, Tag } from "lucide-react";
import { Restaurant } from "@shared/types";
import { cn, formatCurrency } from "@/lib/utils";

interface RestaurantCardProps {
  restaurant: Restaurant;
  showPrice?: boolean;
}

export function RestaurantCard({ restaurant, showPrice = true }: RestaurantCardProps) {
  return (
    <Link
      href={`/restaurant/${restaurant.slug}`}
      className="group block bg-white rounded-xl border hover:shadow-lg hover:border-orange-200 transition-all overflow-hidden"
    >
      <div className="flex">
        {/* Image */}
        <div className="relative w-40 h-32 flex-shrink-0">
          <Image
            src={restaurant.coverImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"}
            alt={restaurant.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {restaurant.activeDeals > 0 && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {restaurant.activeDeals} deals
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg group-hover:text-orange-600 transition-colors">
                {restaurant.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {restaurant.cuisines.slice(0, 2).join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">{restaurant.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{restaurant.address.split(",")[0]}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{restaurant.isOpen ? "Open" : "Closed"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            {showPrice && (
              <span className="text-sm text-gray-600">
                Avg. {formatCurrency(restaurant.avgPrice)} for two
              </span>
            )}
            <span className="text-sm text-gray-400">
              {restaurant.reviewCount.toLocaleString()} reviews
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
