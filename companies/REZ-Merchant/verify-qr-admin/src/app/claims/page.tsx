"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList,
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  MapPin,
  X,
} from "lucide-react";
import { ClaimCard } from "@/components/ClaimCard";
import {
  getClaims,
  getServiceCenters,
  updateClaimStatus,
  assignServiceCenter,
  type Claim,
  type ServiceCenter,
} from "@/services/api";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [assignModal, setAssignModal] = useState<Claim | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getClaims({
        page: currentPage,
        limit: 12,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
      });

      if (response.success && response.data) {
        setClaims(response.data.claims);
        setTotalPages(response.data.pages);
      }
    } catch (error) {
      console.error("Failed to fetch claims:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, typeFilter]);

  const fetchServiceCenters = async () => {
    try {
      const response = await getServiceCenters({ status: "active" });
      if (response.success && response.data) {
        setServiceCenters(response.data.centers);
      }
    } catch (error) {
      console.error("Failed to fetch service centers:", error);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  useEffect(() => {
    fetchServiceCenters();
  }, []);

  const handleUpdateStatus = async (
    claim: Claim,
    status: "approved" | "rejected" | "escalated"
  ) => {
    setIsUpdating(true);
    try {
      const response = await updateClaimStatus(claim.id, status);
      if (response.success) {
        fetchClaims();
      } else {
        alert(response.error || "Failed to update claim");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignCenter = (claim: Claim) => {
    setAssignModal(claim);
    setSelectedCenter(claim.serviceCenterId || "");
  };

  const handleAssignSubmit = async () => {
    if (!assignModal || !selectedCenter) return;

    setIsUpdating(true);
    try {
      const response = await assignServiceCenter(assignModal.id, selectedCenter);
      if (response.success) {
        setAssignModal(null);
        fetchClaims();
      } else {
        alert(response.error || "Failed to assign service center");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewDetails = (claim: Claim) => {
    setSelectedClaim(claim);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "escalated":
        return <ArrowUpRight className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Claims Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Process and manage warranty and support claims
          </p>
        </div>
        <button
          onClick={fetchClaims}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {claims.filter((c) => c.status === "pending").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {claims.filter((c) => c.status === "approved").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {claims.filter((c) => c.status === "rejected").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <ArrowUpRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Escalated</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {claims.filter((c) => c.status === "escalated").length}
              </p>
            </div>
          </div>
        </div>
      </div>

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
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="escalated">Escalated</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="warranty">Warranty</option>
            <option value="support">Support</option>
            <option value="replacement">Replacement</option>
          </select>
        </div>
      </div>

      {/* Claims Grid */}
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
      ) : claims.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Claims Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {statusFilter === "pending"
              ? "No pending claims to process."
              : "No claims match your current filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {claims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onUpdateStatus={handleUpdateStatus}
              onAssignCenter={handleAssignCenter}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Assign Service Center Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assign Service Center
              </h2>
              <button
                onClick={() => setAssignModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Service Center
              </label>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a service center...</option>
                {serviceCenters.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name} - {center.city}, {center.state}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAssignModal(null)}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={!selectedCenter || isUpdating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Details Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Claim Details
              </h2>
              <button
                onClick={() => setSelectedClaim(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedClaim.status)}
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {selectedClaim.claimType} Claim - {selectedClaim.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Serial Number</p>
                  <p className="font-mono text-gray-900 dark:text-white">{selectedClaim.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Submitted</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedClaim.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customer Name</p>
                  <p className="text-gray-900 dark:text-white">{selectedClaim.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white">{selectedClaim.customerEmail}</p>
                </div>
                {selectedClaim.customerPhone && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-white">{selectedClaim.customerPhone}</p>
                  </div>
                )}
                {selectedClaim.serviceCenterName && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Service Center</p>
                    <p className="text-gray-900 dark:text-white">{selectedClaim.serviceCenterName}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</p>
                <p className="text-gray-900 dark:text-white">{selectedClaim.description}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedClaim(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
