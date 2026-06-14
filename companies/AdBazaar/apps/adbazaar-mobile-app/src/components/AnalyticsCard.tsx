import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
}

export function StatCard({ title, value, change, subtitle }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-1">
      <Text className="text-sm text-gray-500 mb-1">{title}</Text>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      {change !== undefined && (
        <View className="flex-row items-center mt-1">
          <Text
            className={`text-xs font-medium ${
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {isPositive ? '+' : ''}
            {change}%
          </Text>
          <Text className="text-xs text-gray-400 ml-1">vs last period</Text>
        </View>
      )}
      {subtitle && (
        <Text className="text-xs text-gray-400 mt-1">{subtitle}</Text>
      )}
    </View>
  );
}

interface AnalyticsOverviewProps {
  totalPosts: number;
  totalEngagement: number;
  engagementRate: number;
  totalReach: number;
}

export function AnalyticsOverview({
  totalPosts,
  totalEngagement,
  engagementRate,
  totalReach,
}: AnalyticsOverviewProps) {
  return (
    <View className="px-4 mb-4">
      <View className="flex-row flex-wrap -mx-1">
        <View className="w-1/2 px-1 mb-2">
          <StatCard title="Total Posts" value={totalPosts} />
        </View>
        <View className="w-1/2 px-1 mb-2">
          <StatCard title="Engagement" value={totalEngagement} />
        </View>
        <View className="w-1/2 px-1 mb-2">
          <StatCard
            title="Engagement Rate"
            value={`${engagementRate.toFixed(1)}%`}
          />
        </View>
        <View className="w-1/2 px-1 mb-2">
          <StatCard title="Total Reach" value={totalReach} />
        </View>
      </View>
    </View>
  );
}
