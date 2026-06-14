"use client";

import { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Ban,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";
import type { Serial } from "@/services/api";

interface SerialTableProps {
  serials: Serial[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onStatusFilter: (status: string) => void;
  onView: (serial: Serial) => void;
  onRevoke: (serial: Serial) => void;
  onExport: () => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  active: {
    label: "Active",
    icon: CheckCircle,
    class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  used: {
    label: "Used",
    icon: Clock,
    class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  expired: {
    label: "Expired",
    icon: AlertTriangle,
    class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  revoked: {
    label: "Revoked",
    icon: Ban,
    class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function SerialTable({
  serials,
  totalPages,
  currentPage,
  totalItems,
  onPageChange,
  onSearch,
  onStatusFilter,
  onView,
  onRevoke,
  onExport,
  isLoading,
}: SerialTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    onStatusFilter(status);
  };

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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by serial number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>

            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Serial Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Used / Expires
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading serials...</p>
                </td>
              </tr>
            ) : serials.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <XCircle className="w-6 h-6 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No serials found</p>
                </td>
              </tr>
            ) : (
              serials.map((serial) => {
                const status = STATUS_CONFIG[serial.status];
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={serial.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {serial.serialNumber}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {serial.productName || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {serial.productId || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                          status.class
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(serial.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {serial.usedAt ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          Used {formatDate(serial.usedAt)}
                        </span>
                      ) : serial.expiresAt ? (
                        <span>Expires {formatDate(serial.expiresAt)}</span>
                      ) : (
                        "No expiry"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === serial.id ? null : serial.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openMenu === serial.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-10">
                            <button
                              onClick={() => {
                                onView(serial);
                                setOpenMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            {serial.status !== "revoked" && serial.status !== "used" && (
                              <button
                                onClick={() => {
                                  onRevoke(serial);
                                  setOpenMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Ban className="w-4 h-4" />
                                Revoke
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalItems)} of{" "}
            {totalItems} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={clsx(
                      "w-10 h-10 rounded-lg text-sm font-medium transition-colors",
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
