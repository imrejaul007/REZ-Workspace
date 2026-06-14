'use client'

import { CheckCircle, XCircle, AlertCircle, Clock, Shield, Building2, FileCheck, Users } from 'lucide-react'

type BadgeType = 'verified' | 'pending' | 'rejected' | 'expired' | 'secure' | 'compliant' | 'identity' | 'documents'

interface TrustBadgeProps {
  type: BadgeType
  label: string
  description?: string
  status: 'active' | 'inactive' | 'pending'
}

const badgeConfig: Record<BadgeType, { icon: typeof CheckCircle, color: string, bgColor: string }> = {
  verified: { icon: CheckCircle, color: 'text-trust-600', bgColor: 'bg-trust-50' },
  pending: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  rejected: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  expired: { icon: AlertCircle, color: 'text-slate-500', bgColor: 'bg-slate-100' },
  secure: { icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  compliant: { icon: FileCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  identity: { icon: Building2, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  documents: { icon: FileCheck, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
}

export default function TrustBadge({ type, label, description, status }: TrustBadgeProps) {
  const config = badgeConfig[type]
  const Icon = config.icon

  const statusBorderColor = {
    active: 'border-trust-300',
    inactive: 'border-slate-300',
    pending: 'border-amber-300',
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border-2 ${statusBorderColor[status]} ${config.bgColor} transition-all duration-200 hover:shadow-md`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-slate-800">{label}</h4>
          {status === 'active' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-trust-100 text-trust-700">
              Active
            </span>
          )}
          {status === 'pending' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              Pending
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}