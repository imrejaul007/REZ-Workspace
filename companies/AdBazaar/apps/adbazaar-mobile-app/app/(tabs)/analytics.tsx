import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useAnalytics } from '../../src/hooks/useAnalytics';
import { StatCard, AnalyticsOverview } from '../../src/components';

const screenWidth = Dimensions.get('window').width;

const PERIODS = [
  { label: '7 Days', value: '7d' as const },
  { label: '30 Days', value: '30d' as const },
  { label: '90 Days', value: '90d' as const },
];

export default function AnalyticsScreen() {
  const {
    analytics,
    isLoading,
    analyticsPeriod,
    changePeriod,
    fetchAnalytics,
  } = useAnalytics();

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#6366f1',
    },
  };

  // Prepare bar chart data
  const barChartData = {
    labels: analytics?.postsByDay.slice(-7).map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: analytics?.postsByDay.slice(-7).map((d) => d.count) || [0, 0, 0, 0, 0, 0, 0],
      },
    ],
  };

  // Prepare pie chart data
  const pieChartData = analytics?.engagementByPlatform.map((item, index) => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    population: item.engagement,
    color: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][index % 6],
    legendFontColor: '#6b7280',
    legendFontSize: 12,
  })) || [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Analytics</Text>
        <Text className="text-sm text-gray-500">Track your performance</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchAnalytics} />
        }
      >
        {/* Period Selector */}
        <View className="px-4 py-3">
          <View className="flex-row bg-gray-100 rounded-xl p-1">
            {PERIODS.map((period) => (
              <TouchableOpacity
                key={period.value}
                onPress={() => changePeriod(period.value)}
                className={`flex-1 py-2 rounded-lg ${
                  analyticsPeriod === period.value ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text
                  className={`text-center text-sm font-medium ${
                    analyticsPeriod === period.value
                      ? 'text-indigo-600'
                      : 'text-gray-600'
                  }`}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {analytics ? (
          <>
            {/* Overview Stats */}
            <AnalyticsOverview
              totalPosts={analytics.totalPosts}
              totalEngagement={analytics.totalEngagement}
              engagementRate={analytics.engagementRate}
              totalReach={analytics.totalReach}
            />

            {/* Posts Chart */}
            <View className="px-4 mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Posts Over Time
              </Text>
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <BarChart
                  data={barChartData}
                  width={screenWidth - 48}
                  height={200}
                  chartConfig={chartConfig}
                  style={{
                    borderRadius: 16,
                    marginLeft: -16,
                  }}
                  showValuesOnTopOfBars
                  fromZero
                  yAxisLabel=""
                  yAxisSuffix=""
                />
              </View>
            </View>

            {/* Engagement by Platform */}
            {pieChartData.length > 0 && (
              <View className="px-4 mb-4">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Engagement by Platform
                </Text>
                <View className="bg-white rounded-2xl p-4 shadow-sm items-center">
                  <PieChart
                    data={pieChartData}
                    width={screenWidth - 48}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              </View>
            )}

            {/* Recent Activity */}
            <View className="px-4 pb-8">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Recent Activity
              </Text>
              {analytics.recentActivity.map((activity) => (
                <View
                  key={activity.id}
                  className="bg-white rounded-xl p-4 mb-2 shadow-sm flex-row items-center"
                >
                  <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                    <Text className="text-lg">
                      {activity.type === 'post_published' && '📤'}
                      {activity.type === 'post_scheduled' && '📅'}
                      {activity.type === 'engagement' && '💬'}
                      {activity.type === 'follower_gain' && '👥'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  {activity.metric !== undefined && (
                    <View className="bg-green-100 px-2 py-1 rounded-full">
                      <Text className="text-xs font-medium text-green-600">
                        +{activity.metric}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              {analytics.recentActivity.length === 0 && (
                <View className="bg-white rounded-2xl p-6 items-center">
                  <Text className="text-4xl mb-3">📊</Text>
                  <Text className="text-gray-600 text-center">
                    No recent activity
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-gray-600 text-center mb-4">
              No analytics data available yet
            </Text>
            <TouchableOpacity
              className="bg-indigo-600 px-6 py-3 rounded-xl"
              onPress={fetchAnalytics}
            >
              <Text className="text-white font-semibold">Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
