"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldAlert,
  RefreshCw,
  Filter,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { FraudAlertCard } from "@/components/FraudAlert";
import {
  getFraudAlerts,
  getFraudStats,
  reviewFraudAlert,
  type FraudAlert,
} from "@/services/api";
import { StatsCard } from "@/components/StatsCard";

export default function FraudPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [fraudStats, setFraudStats] = useState<{
    totalAlerts: number;
    criticalAlerts: number;
    recentTrend: number;
    topAlertTypes: { type: string; count: number }[];
  } | null>(null);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getFraudAlerts({
        page: currentPage,
        limit: 12,
        status: statusFilter !== "all" ? statusFilter : undefined,
        severity: severityFilter !== "all" ? severityFilter : undefined,
      });

      if (response.success && response.data) {
        setAlerts(response.data.alerts);
        setTotalPages(response.data.pages);
      }
    } catch (error) {
      console.error("Failed to fetch fraud alerts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, severityFilter]);

  const fetchStats = async () => {
    try {
      const response = await getFraudStats();
      if (response.success && response.data) {
        setFraudStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch fraud stats:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReview = async (
    alert: FraudAlert,
    action: "resolve" | "dismiss" | "escalate"
  ) => {
    try {
      const response = await reviewFraudAlert(alert.id, action);
      if (response.success) {
        fetchAlerts();
        fetchStats();
      } else {
        alert(response.error || "Failed to update alert");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fraud Queue</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review and manage suspicious QR scan activities
          </p>
        </div>
        <button
          onClick={() => {
            fetchAlerts();
            fetchStats();
          }}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {fraudStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Alerts"
            value={fraudStats.totalAlerts}
            icon={ShieldAlert}
            trend={fraudStats.recentTrend}
            trendLabel="this week"
          />
          <StatsCard
            title="Critical Alerts"
            value={fraudStats.criticalAlerts}
            icon={AlertTriangle}
            variant="danger"
          />
          <StatsCard
            title="Resolved Today"
            value={0}
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Trend"
            value={`${fraudStats.recentTrend > 0 ? "+" : ""}${fraudStats.recentTrend}%`}
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <ShieldAlert className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Fraud Alerts</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {statusFilter === "pending"
              ? "No pending alerts to review. Check back later."
              : "No alerts match your current filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => (
              <FraudAlertCard key={alert.id} alert={alert} onReview={handleReview} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
