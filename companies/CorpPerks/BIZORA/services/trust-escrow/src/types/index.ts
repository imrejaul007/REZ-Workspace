// Escrow Types for B2B Transactions

export type EscrowStatus =
  | 'pending'      // Created, awaiting funding
  | 'funded'       // Funds held, conditions to be met
  | 'released'    // Funds released to seller
  | 'refunded'    // Funds refunded to buyer
  | 'disputed'    // Under dispute resolution
  | 'cancelled';  // Cancelled before funding

export type EscrowRole = 'buyer' | 'seller' | 'arbiter';

export interface EscrowCondition {
  type: 'delivery' | 'approval' | 'milestone' | 'custom';
  description: string;
  completedAt?: Date;
  completedBy?: string;
}

export interface EscrowMilestone {
  name: string;
  amount: number;
  completed: boolean;
  completedAt?: Date;
}

export interface EscrowDispute {
  reason: string;
  filedBy: string;
  filedAt: Date;
  resolvedAt?: Date;
  resolution?: 'release_to_seller' | 'refund_to_buyer' | 'split';
}

export interface TransactionFee {
  percentage: number;
  fixed: number;
  chargedTo: 'buyer' | 'seller' | 'split';
}

export interface AuditLog {
  action: string;
  performedBy: string;
  performedAt: Date;
  details?: Record<string, unknown>;
}

export interface EscrowDocument {
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface CreateEscrowInput {
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  description: string;
  conditions: EscrowCondition[];
  milestones?: EscrowMilestone[];
  feeConfig?: TransactionFee;
  arbiterId?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ReleaseEscrowInput {
  escrowId: string;
  releasedBy: string;
  role: EscrowRole;
  reason?: string;
  milestoneName?: string; // For partial releases
}

export interface RefundEscrowInput {
  escrowId: string;
  refundedBy: string;
  reason: string;
}

export interface DisputeEscrowInput {
  escrowId: string;
  disputedBy: string;
  reason: string;
}