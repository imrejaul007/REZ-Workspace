"use client";

import { Product } from "@/types/chat";
import { Star, ShoppingCart, Heart, X, TrendingUp, Zap, Shield } from "lucide-react";
import Link from "next/link";

interface RecommendationsProps {
  onClose: () => void;
  products?: Product[];
}

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    description: "Active noise cancellation with 30-hour battery life",
    price: 149.99,
    originalPrice: 199.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
    rating: 4.8,
    reviewCount: 2341,
    badges: ["Best Seller", "Free Shipping"],
    link: "/product/headphones-1",
  },
  {
    id: "2",
    name: "Smart Fitness Watch Pro",
    description: "Track your health with advanced sensors",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
    rating: 4.7,
    reviewCount: 1823,
    badges: ["New Arrival"],
    link: "/product/watch-1",
  },
  {
    id: "3",
    name: "Ergonomic Office Chair",
    description: "Lumbar support with breathable mesh",
    price: 349.99,
    originalPrice: 449.99,
    image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=300&h=300&fit=crop",
    rating: 4.6,
    reviewCount: 892,
    badges: ["Sale"],
    link: "/product/chair-1",
  },
  {
    id: "4",
    name: "Portable Bluetooth Speaker",
    description: "Waterproof with 360-degree sound",
    price: 79.99,
    originalPrice: 99.99,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
    rating: 4.5,
    reviewCount: 3156,
    badges: ["Limited Offer"],
    link: "/product/speaker-1",
  },
];

export default function Recommendations({
  onClose,
  products = defaultProducts,
}: RecommendationsProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : star - 0.5 <= rating
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-surface-300"
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-surface-500">({rating})</span>
      </div>
    );
  };

  return (
    <div className="animate-slide-up rounded-2xl bg-gradient-to-br from-brand-50 to-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-600" />
          <h3 className="text-lg font-semibold text-surface-900">
            Recommended for You
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="group relative overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Badges */}
            {product.badges && product.badges.length > 0 && (
              <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
                {product.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      badge === "Sale" || badge === "Limited Offer"
                        ? "bg-red-500 text-white"
                        : badge === "Best Seller"
                        ? "bg-orange-500 text-white"
                        : badge === "New Arrival"
                        ? "bg-green-500 text-white"
                        : "bg-brand-500 text-white"
                    }`}
                  >
                    {badge === "Sale" || badge === "Limited Offer" ? (
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" /> {badge}
                      </span>
                    ) : (
                      badge
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Wishlist Button */}
            <button className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-surface-400 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:text-red-500">
              <Heart className="h-4 w-4" />
            </button>

            {/* Product Image */}
            <Link href={product.link} className="block">
              <div className="relative aspect-square overflow-hidden bg-surface-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </Link>

            {/* Product Info */}
            <div className="p-4">
              <Link href={product.link}>
                <h4 className="mb-1 line-clamp-2 text-sm font-medium text-surface-900 transition-colors hover:text-brand-600">
                  {product.name}
                </h4>
              </Link>
              <p className="mb-2 line-clamp-1 text-xs text-surface-500">
                {product.description}
              </p>

              {/* Rating */}
              <div className="mb-2">{renderStars(product.rating)}</div>

              {/* Price */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-surface-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-sm text-surface-400 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">
                      {Math.round(
                        ((product.originalPrice - product.price) /
                          product.originalPrice) *
                          100
                      )}
                      % OFF
                    </span>
                  </>
                )}
              </div>

              {/* Add to Cart Button */}
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600">
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-surface-600">
            <Shield className="h-4 w-4 text-green-600" />
            Secure Checkout
          </div>
          <div className="flex items-center gap-2 text-sm text-surface-600">
            <Truck className="h-4 w-4 text-brand-500" />
            Free Returns
          </div>
        </div>
        <Link
          href="/products"
          className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
          View All Products
        </Link>
      </div>
    </div>
  );
}

// Helper component for Truck icon (if not using lucide)
function Truck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
      />
    </svg>
  );
}
