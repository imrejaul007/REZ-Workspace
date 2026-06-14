"use client";

import { AlertTriangle, Clock, MapPin, Monitor, Globe, Check, X, ArrowUp } from "lucide-react";
import { clsx } from "clsx";
import type { FraudAlert } from "@/services/api";

interface FraudAlertCardProps {
  alert: FraudAlert;
  onReview: (alert: FraudAlert, action: "resolve" | "dismiss" | "escalate") => void;
}

const ALERT_TYPE_CONFIG = {
  duplicate_scan: {
    label: "Duplicate Scan",
    icon: Monitor,
    class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  unauthorized_domain: {
    label: "Unauthorized Domain",
    icon: Globe,
    class: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  geo_mismatch: {
    label: "Geo Mismatch",
    icon: MapPin,
    class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  suspicious_pattern: {
    label: "Suspicious Pattern",
    icon: AlertTriangle,
    class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

const SEVERITY_CONFIG = {
  low: {
    class: "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300",
    label: "Low",
  },
  medium: {
    class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    label: "Medium",
  },
  high: {
    class: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    label: "High",
  },
  critical: {
    class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    label: "Critical",
  },
};

const STATUS_CONFIG = {
  pending: {
    class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    label: "Pending Review",
  },
  reviewed: {
    class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Reviewed",
  },
  resolved: {
    class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    label: "Resolved",
  },
  dismissed: {
    class: "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300",
    label: "Dismissed",
  },
};

export function FraudAlertCard({ alert, onReview }: FraudAlertCardProps) {
  const alertType = ALERT_TYPE_CONFIG[alert.alertType];
  const severity = SEVERITY_CONFIG[alert.severity];
  const status = STATUS_CONFIG[alert.status];
  const AlertIcon = alertType.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={clsx(
        "bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6",
        alert.severity === "critical"
          ? "border-red-300 dark:border-red-700"
          : alert.severity === "high"
          ? "border-orange-300 dark:border-orange-700"
          : "border-gray-100 dark:border-gray-700"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx("p-2 rounded-lg", alertType.class)}>
            <AlertIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{alertType.label}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {alert.serialNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "px-2.5 py-1 rounded-full text-xs font-medium",
              severity.class
            )}
          >
            {severity.label}
          </span>
          <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium", status.class)}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        {alert.details.ipAddress && (
          <div className="flex items-center gap-2 text-sm">
            <Monitor className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">IP:</span>
            <span className="font-mono text-gray-900 dark:text-white">{alert.details.ipAddress}</span>
          </div>
        )}

        {alert.details.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Location:</span>
            <span className="text-gray-900 dark:text-white">{alert.details.location}</span>
          </div>
        )}

        {alert.details.scanAttempts && alert.details.scanAttempts > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Attempts:</span>
            <span className="text-gray-900 dark:text-white">
              {alert.details.scanAttempts} scans detected
            </span>
          </div>
        )}

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Reported: {formatDate(alert.reportedAt)}
        </div>
      </div>

      {/* Actions */}
      {alert.status === "pending" && (
        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onReview(alert, "resolve")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Resolve
          </button>
          <button
            onClick={() => onReview(alert, "dismiss")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
            Dismiss
          </button>
          <button
            onClick={() => onReview(alert, "escalate")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
            Escalate
          </button>
        </div>
      )}
    </div>
  );
}
