"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  ClipboardList,
  Calendar,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import {
  getAnalytics,
  getFraudAnalytics,
  getClaimAnalytics,
  type AnalyticsData,
} from "@/services/api";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [fraudAnalytics, setFraudAnalytics] = useState<{
    totalFraud: number;
    byType: { type: string; count: number; trend: number }[];
    bySeverity: { severity: string; count: number }[];
    byDay: { date: string; count: number }[];
  } | null>(null);
  const [claimAnalytics, setClaimAnalytics] = useState<{
    totalClaims: number;
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
    avgResolutionTime: number;
    resolutionTrend: number[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const [analyticsRes, fraudRes, claimRes] = await Promise.all([
        getAnalytics({ startDate, endDate, groupBy: "day" }),
        getFraudAnalytics(),
        getClaimAnalytics(),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
      if (fraudRes.success && fraudRes.data) {
        setFraudAnalytics(fraudRes.data);
      }
      if (claimRes.success && claimRes.data) {
        setClaimAnalytics(claimRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const maxScans = analytics?.scansByDay?.reduce((max, d) => Math.max(max, d.count), 0) || 1;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Detailed insights into your QR verification system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Scans"
              value={analytics?.scansByDay?.reduce((sum, d) => sum + d.count, 0) || 0}
              icon={Activity}
              trend={15}
              trendLabel="vs previous period"
            />
            <StatsCard
              title="Serial Usage Rate"
              value={`${analytics?.serialUsageRate?.toFixed(1) || 0}%`}
              icon={BarChart3}
              variant="success"
            />
            <StatsCard
              title="Fraud Attempts"
              value={fraudAnalytics?.totalFraud || 0}
              icon={ShieldAlert}
              variant="danger"
            />
            <StatsCard
              title="Avg Claim Resolution"
              value={`${claimAnalytics?.avgResolutionTime?.toFixed(1) || 0} days`}
              icon={ClipboardList}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Scans Over Time */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Scans Over Time
              </h2>
              <div className="h-64 flex items-end gap-2">
                {analytics?.scansByDay?.slice(-14).map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{
                        height: `${Math.max(4, (day.count / maxScans) * 200)}px`,
                      }}
                      title={`${day.date}: ${day.count} scans`}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scans by Region */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Scans by Region
              </h2>
              <div className="space-y-4">
                {analytics?.scansByRegion?.slice(0, 6).map((region, index) => {
                  const maxCount =
                    analytics.scansByRegion?.reduce((max, r) => Math.max(max, r.count), 0) || 1;
                  const percentage = ((region.count / maxCount) * 100).toFixed(1);

                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {region.region}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {region.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fraud by Type */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Fraud by Type
              </h2>
              <div className="space-y-3">
                {fraudAnalytics?.byType?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {item.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.trend > 0 ? (
                            <span className="text-red-500 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> +{item.trend}%
                            </span>
                          ) : (
                            <span className="text-green-500 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" /> {item.trend}%
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Claims by Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Claims by Status
              </h2>
              <div className="space-y-3">
                {claimAnalytics?.byStatus?.map((item, index) => {
                  const colors: Record<string, string> = {
                    pending: "bg-yellow-500",
                    approved: "bg-green-500",
                    rejected: "bg-red-500",
                    escalated: "bg-orange-500",
                  };

                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[item.status] || "bg-gray-500"}`} />
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {item.status}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {claimAnalytics?.totalClaims || 0}
                </p>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Top Products
              </h2>
              <div className="space-y-3">
                {analytics?.topProducts?.slice(0, 5).map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                          {product.productName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {product.productId}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {product.scans.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
