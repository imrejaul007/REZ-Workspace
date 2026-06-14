"use client";

import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { clsx } from "clsx";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  description,
  variant = "default",
}: StatsCardProps) {
  const variantStyles = {
    default: "bg-white dark:bg-gray-800",
    success: "bg-green-50 dark:bg-green-900/20",
    warning: "bg-yellow-50 dark:bg-yellow-900/20",
    danger: "bg-red-50 dark:bg-red-900/20",
  };

  const iconStyles = {
    default: "text-gray-600 dark:text-gray-400",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400",
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
    if (trend > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "text-gray-500";
    return trend > 0 ? "text-green-500" : "text-red-500";
  };

  return (
    <div className={clsx("rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>

          {(trend !== undefined || trendLabel || description) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {trend !== undefined && (
                <div className={clsx("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
                  {getTrendIcon()}
                  <span>{Math.abs(trend)}%</span>
                </div>
              )}
              {trendLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400">{trendLabel}</span>
              )}
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
              )}
            </div>
          )}
        </div>

        <div className={clsx("p-3 rounded-lg", variantStyles[variant])}>
          <Icon className={clsx("w-6 h-6", iconStyles[variant])} />
        </div>
      </div>
    </div>
  );
}
