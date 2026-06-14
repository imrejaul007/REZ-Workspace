"use client";

import { useEffect, useState } from "react";
import {
  QrCode,
  ShieldAlert,
  ClipboardList,
  MapPin,
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { getDashboardStats } from "@/services/api";
import type { DashboardStats } from "@/services/api";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || "Failed to load dashboard stats");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">Error Loading Dashboard</h3>
          <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of your QR verification system
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Serials"
          value={stats.totalSerials.toLocaleString()}
          icon={QrCode}
          trend={12}
          trendLabel="vs last month"
        />
        <StatsCard
          title="Active Serials"
          value={stats.activeSerials.toLocaleString()}
          icon={CheckCircle}
          variant="success"
          trend={8}
          trendLabel="vs last month"
        />
        <StatsCard
          title="Fraud Attempts"
          value={stats.fraudAttempts.toLocaleString()}
          icon={ShieldAlert}
          variant="danger"
          trend={-15}
          trendLabel="blocked this week"
        />
        <StatsCard
          title="Pending Claims"
          value={stats.pendingClaims.toLocaleString()}
          icon={ClipboardList}
          variant="warning"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Monthly Scans"
          value={stats.monthlyScans.toLocaleString()}
          icon={Activity}
          trend={stats.scanGrowth}
          trendLabel="growth"
        />
        <StatsCard
          title="Service Centers"
          value={stats.serviceCenters}
          icon={MapPin}
        />
        <StatsCard
          title="Resolved Claims"
          value={stats.resolvedClaims.toLocaleString()}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Quick Links and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/serials/generate"
              className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              <span className="font-medium">Generate New Serials</span>
            </Link>
            <Link
              href="/fraud"
              className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
            >
              <ShieldAlert className="w-5 h-5" />
              <span className="font-medium">Review Fraud Alerts</span>
            </Link>
            <Link
              href="/claims"
              className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            >
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium">Process Claims</span>
            </Link>
          </div>
        </div>

        {/* Top Product */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Product</h2>
          <div className="text-center py-6">
            <TrendingUp className="w-10 h-10 mx-auto text-green-500 mb-3" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.topProduct}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Most scanned product</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            ) : (
              stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    {activity.type === "scan" && <Activity className="w-4 h-4 text-blue-500" />}
                    {activity.type === "claim" && <ClipboardList className="w-4 h-4 text-purple-500" />}
                    {activity.type === "fraud" && <ShieldAlert className="w-4 h-4 text-red-500" />}
                    {activity.type === "serial_created" && <QrCode className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
