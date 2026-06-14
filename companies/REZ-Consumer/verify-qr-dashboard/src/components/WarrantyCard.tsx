'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Warranty } from '@/services/api';

interface WarrantyCardProps {
  warranty: Warranty;
  expanded?: boolean;
  onAction?: (action: 'claim' | 'transfer' | 'verify') => void;
}

export default function WarrantyCard({ warranty, expanded = false, onAction }: WarrantyCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const getStatusBadge = () => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expired' },
      claimed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Claimed' },
      transferred: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Transferred' },
    };
    const config = statusConfig[warranty.status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getDaysRemaining = () => {
    const endDate = new Date(warranty.warrantyEndDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const isExpired = warranty.status === 'expired' || daysRemaining < 0;
  const isExpiringSoon = !isExpired && daysRemaining <= 30;

  const getWarrantyProgress = () => {
    const startDate = new Date(warranty.warrantyStartDate);
    const endDate = new Date(warranty.warrantyEndDate);
    const today = new Date();
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  };

  const progress = getWarrantyProgress();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* QR Code Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <QRCodeSVG
            value={warranty.qrCode}
            size={80}
            level="M"
            includeMargin={false}
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            {getStatusBadge()}
            {isExpiringSoon && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-800">
                Expiring Soon
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{warranty.productName}</h3>
          <p className="text-sm text-gray-500">{warranty.brand}</p>
          <p className="text-xs text-gray-400 font-mono mt-1">{warranty.qrCode}</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-4">
        {/* Progress Bar */}
        {!isExpired && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Warranty Period</span>
              <span>
                {isExpired ? 'Expired' : `${daysRemaining} days remaining`}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isExpiringSoon ? 'bg-warning-500' : 'bg-primary-500'
                }`}
                style={{ width: `${100 - progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <DetailItem label="Category" value={warranty.productCategory} />
          <DetailItem label="Serial Number" value={warranty.serialNumber} mono />
          <DetailItem
            label="Purchase Date"
            value={new Date(warranty.purchaseDate).toLocaleDateString()}
          />
          <DetailItem
            label="Expires"
            value={new Date(warranty.warrantyEndDate).toLocaleDateString()}
            highlight={isExpiringSoon}
          />
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {warranty.verificationCount} verifications
            </span>
            {warranty.claimHistory.length > 0 && (
              <span className="flex items-center gap-1 text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {warranty.claimHistory.length} claim(s)
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary-600 hover:text-primary-800"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="pt-4 border-t border-gray-100 space-y-4">
            {/* Owner Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Owner</p>
              <p className="text-sm font-medium text-gray-900">{warranty.owner.name}</p>
              <p className="text-xs text-gray-500">{warranty.owner.email}</p>
            </div>

            {/* Action Buttons */}
            {warranty.status === 'active' && (
              <div className="flex gap-2">
                {onAction ? (
                  <>
                    <button
                      onClick={() => onAction('claim')}
                      className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      File Claim
                    </button>
                    <button
                      onClick={() => onAction('transfer')}
                      className="flex-1 px-3 py-2 text-sm font-medium text-secondary-600 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                    >
                      Transfer
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href={`/claims?warrantyId=${warranty.id}`}
                      className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors text-center"
                    >
                      File Claim
                    </a>
                    <a
                      href={`/transfer?warrantyId=${warranty.id}`}
                      className="flex-1 px-3 py-2 text-sm font-medium text-secondary-600 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors text-center"
                    >
                      Transfer
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`text-sm font-medium ${
          highlight ? 'text-warning-600' : 'text-gray-900'
        } ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}
