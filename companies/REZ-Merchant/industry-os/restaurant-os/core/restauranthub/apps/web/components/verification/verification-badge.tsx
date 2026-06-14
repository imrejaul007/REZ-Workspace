'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NOT_INITIATED';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function VerificationBadge({
  status,
  size = 'md',
  showIcon = true,
  className
}: VerificationBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return {
          variant: 'default' as const,
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          label: 'Verified'
        };
      case 'PENDING':
        return {
          variant: 'secondary' as const,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          label: 'Pending'
        };
      case 'REJECTED':
        return {
          variant: 'destructive' as const,
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          label: 'Rejected'
        };
      case 'NOT_INITIATED':
      default:
        return {
          variant: 'outline' as const,
          color: 'bg-gray-100 text-gray-600 border-gray-200',
          icon: AlertTriangle,
          label: 'Not Verified'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.color,
        sizeClasses[size],
        'flex items-center gap-1.5',
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}

interface VerificationStatusProps {
  verificationScore?: number;
  aadharVerified?: boolean;
  aadhaarStatus?: string;
  requiredDocuments?: string[];
  verifiedDocuments?: Array<{ type: string; name: string; verifiedAt: string }>;
  isFullyVerified?: boolean;
  className?: string;
}

export function VerificationStatus({
  verificationScore = 0,
  aadharVerified = false,
  aadhaarStatus = 'NOT_INITIATED',
  requiredDocuments = [],
  verifiedDocuments = [],
  isFullyVerified = false,
  className
}: VerificationStatusProps) {
  const getOverallStatus = () => {
    if (isFullyVerified) return 'VERIFIED';
    if (verificationScore >= 80) return 'PENDING';
    if (verificationScore > 0) return 'PENDING';
    return 'NOT_INITIATED';
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Verification Status</span>
        <VerificationBadge status={getOverallStatus()} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Overall Score</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  verificationScore >= 80 ? 'bg-green-500' :
                  verificationScore >= 60 ? 'bg-yellow-500' :
                  verificationScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(verificationScore, 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium">{verificationScore}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Aadhaar</span>
          <VerificationBadge status={aadhaarStatus as unknown} size="sm" />
        </div>

        {requiredDocuments.length > 0 && (
          <div className="space-y-1">
            <span className="text-muted-foreground">Documents</span>
            <div className="pl-3 space-y-1">
              {requiredDocuments.map((docType) => {
                const isVerified = verifiedDocuments.some(doc => doc.type === docType);
                return (
                  <div key={docType} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{docType.replace('_', ' ')}</span>
                    <VerificationBadge
                      status={isVerified ? 'VERIFIED' : 'NOT_INITIATED'}
                      size="sm"
                      showIcon={false}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}