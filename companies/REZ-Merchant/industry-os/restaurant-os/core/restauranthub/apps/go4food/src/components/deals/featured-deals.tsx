"use client";

import Link from "next/link";
import { Percent, Clock, Gift } from "lucide-react";
import { Deal } from "@shared/types";

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
];

export function FeaturedDeals() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {MOCK_DEALS.map((deal) => (
        <Link
          key={deal.id}
          href={`/deals/${deal.slug}`}
          className="group p-4 bg-white rounded-xl border border-green-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              {deal.type === "PERCENTAGE_OFF" && <Percent className="w-5 h-5 text-green-600" />}
              {deal.type === "FREE_DELIVERY" && <Gift className="w-5 h-5 text-green-600" />}
              {deal.type === "FLAT_OFF" && <Clock className="w-5 h-5 text-green-600" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-600">
                  {deal.type === "PERCENTAGE_OFF"
                    ? `${deal.value}% OFF`
                    : deal.type === "FLAT_OFF"
                    ? `₹${deal.value} OFF`
                    : "FREE DELIVERY"}
                </span>
                {deal.source === "BANK" && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {deal.bankName}
                  </span>
                )}
              </div>
              <h4 className="font-medium text-gray-900 mt-1 group-hover:text-green-700">
                {deal.title}
              </h4>
              <p className="text-sm text-gray-500 mt-1">{deal.description}</p>
              {deal.code && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                  {deal.code}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
