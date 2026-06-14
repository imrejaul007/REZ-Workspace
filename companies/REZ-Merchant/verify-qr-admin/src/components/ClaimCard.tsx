"use client";

import { Clock, CheckCircle, XCircle, ArrowUpRight, User, Mail, Phone, FileText, MapPin } from "lucide-react";
import { clsx } from "clsx";
import type { Claim } from "@/services/api";

interface ClaimCardProps {
  claim: Claim;
  onUpdateStatus: (
    claim: Claim,
    status: "approved" | "rejected" | "escalated"
  ) => void;
  onAssignCenter: (claim: Claim) => void;
  onViewDetails: (claim: Claim) => void;
}

const CLAIM_TYPE_CONFIG = {
  warranty: {
    label: "Warranty Claim",
    class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  support: {
    label: "Support Request",
    class: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  replacement: {
    label: "Replacement Request",
    class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    actionColor: "blue",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    actionColor: "red",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    actionColor: "gray",
  },
  escalated: {
    label: "Escalated",
    icon: ArrowUpRight,
    class: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    actionColor: "purple",
  },
};

export function ClaimCard({
  claim,
  onUpdateStatus,
  onAssignCenter,
  onViewDetails,
}: ClaimCardProps) {
  const claimType = CLAIM_TYPE_CONFIG[claim.claimType];
  const status = STATUS_CONFIG[claim.status];
  const StatusIcon = status.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium", claimType.class)}>
                {claimType.label}
              </span>
              <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium", status.class)}>
                {status.label}
              </span>
            </div>
            <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
              {claim.serialNumber}
            </p>
          </div>

          <button
            onClick={() => onViewDetails(claim)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Customer Info */}
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {claim.customerName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{claim.customerEmail}</span>
        </div>

        {claim.customerPhone && (
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{claim.customerPhone}</span>
          </div>
        )}

        <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{claim.description}</p>
        </div>

        {claim.serviceCenterName && (
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {claim.serviceCenterName}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          Submitted {formatDate(claim.submittedAt)}
          {claim.resolvedAt && (
            <>
              <span className="mx-1">•</span>
              <StatusIcon className="w-3 h-3" />
              Resolved {formatDate(claim.resolvedAt)}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {claim.status === "pending" && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStatus(claim, "approved")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => onUpdateStatus(claim, "rejected")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => onAssignCenter(claim)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <MapPin className="w-4 h-4" />
              Assign
            </button>
          </div>
        </div>
      )}

      {claim.status === "approved" && !claim.serviceCenterId && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onAssignCenter(claim)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <MapPin className="w-4 h-4" />
            Assign Service Center
          </button>
        </div>
      )}
    </div>
  );
}
