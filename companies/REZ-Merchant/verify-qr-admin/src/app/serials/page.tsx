"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, AlertTriangle, Ban, Eye, X } from "lucide-react";
import Link from "next/link";
import { SerialTable } from "@/components/SerialTable";
import { getSerials, revokeSerial, exportSerials, type Serial } from "@/services/api";

export default function SerialsPage() {
  const [serials, setSerials] = useState<Serial[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSerial, setSelectedSerial] = useState<Serial | null>(null);
  const [revokeModal, setRevokeModal] = useState<Serial | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchSerials = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getSerials({
        page: currentPage,
        limit: 20,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      });

      if (response.success && response.data) {
        setSerials(response.data.serials);
        setTotalPages(response.data.pages);
        setTotalItems(response.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch serials:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery]);

  useEffect(() => {
    fetchSerials();
  }, [fetchSerials]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleView = (serial: Serial) => {
    setSelectedSerial(serial);
  };

  const handleRevoke = (serial: Serial) => {
    setRevokeModal(serial);
    setRevokeReason("");
  };

  const handleRevokeSubmit = async () => {
    if (!revokeModal || !revokeReason.trim()) return;

    setIsRevoking(true);
    try {
      const response = await revokeSerial(revokeModal.id, revokeReason);
      if (response.success) {
        setRevokeModal(null);
        fetchSerials();
      } else {
        alert(response.error || "Failed to revoke serial");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportSerials({
        format: "csv",
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (response.success && response.data?.downloadUrl) {
        window.open(response.data.downloadUrl, "_blank");
      } else {
        alert(response.error || "Export failed");
      }
    } catch {
      alert("Export failed. Please try again.");
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Serial Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage QR code serials
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchSerials()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link
            href="/serials/generate"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Serials
          </Link>
        </div>
      </div>

      {/* Serial Table */}
      <SerialTable
        serials={serials}
        totalPages={totalPages}
        currentPage={currentPage}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onView={handleView}
        onRevoke={handleRevoke}
        onExport={handleExport}
        isLoading={isLoading}
      />

      {/* View Serial Modal */}
      {selectedSerial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Serial Details</h2>
              <button
                onClick={() => setSelectedSerial(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Serial Number</p>
                  <p className="font-mono text-gray-900 dark:text-white">{selectedSerial.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedSerial.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Product ID</p>
                  <p className="text-gray-900 dark:text-white">{selectedSerial.productId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Product Name</p>
                  <p className="text-gray-900 dark:text-white">{selectedSerial.productName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedSerial.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Expires</p>
                  <p className="text-gray-900 dark:text-white">
                    {selectedSerial.expiresAt
                      ? new Date(selectedSerial.expiresAt).toLocaleString()
                      : "No expiry"}
                  </p>
                </div>
                {selectedSerial.usedAt && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Used At</p>
                      <p className="text-blue-600 dark:text-blue-400">
                        {new Date(selectedSerial.usedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Used By</p>
                      <p className="text-gray-900 dark:text-white">{selectedSerial.usedBy || "Unknown"}</p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">QR Code</p>
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <code className="text-sm font-mono break-all">{selectedSerial.qrCode}</code>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedSerial(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Revoke Serial</h2>
              <button
                onClick={() => setRevokeModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    This action cannot be undone
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Revoking serial <span className="font-mono">{revokeModal.serialNumber}</span> will
                    mark it as invalid and prevent unknown future scans.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for revoking (required)
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Enter the reason for revoking this serial..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRevokeModal(null)}
                disabled={isRevoking}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeSubmit}
                disabled={!revokeReason.trim() || isRevoking}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isRevoking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Revoke Serial
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
