// ContractOS Types

export interface Contract {
  contractId: string;
  contractType: ContractType;
  status: ContractStatus;
  parties: ContractParty[];
  terms: ContractTerms;
  timeline: ContractTimeline;
  governance: ContractGovernance;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type ContractType =
  | 'service_agreement'
  | 'purchase_order'
  | 'supply_agreement'
  | 'partnership'
  | 'employment'
  | 'lease'
  | 'license'
  | 'nda'
  | 'slsa'
  | 'custom';

export type ContractStatus =
  | 'draft'
  | 'pending_approval'
  | 'pending_signature'
  | 'active'
  | 'pending_execution'
  | 'completed'
  | 'terminated'
  | 'expired'
  | 'disputed'
  | 'cancelled';

export interface ContractParty {
  partyId: string;
  partyType: 'merchant' | 'supplier' | 'agent' | 'customer' | 'organization';
  role: 'buyer' | 'seller' | 'provider' | 'receiver' | 'partner' | 'guarantor';
  name: string;
  signatory?: Signatory;
  acceptanceStatus: 'pending' | 'accepted' | 'rejected' | 'signed';
  signedAt?: string;
}

export interface Signatory {
  name: string;
  email: string;
  phone?: string;
  role: string;
  authorized: boolean;
}

export interface ContractTerms {
  effectiveDate?: string;
  expirationDate?: string;
  duration?: ContractDuration;
  payment: PaymentTerms;
  delivery?: DeliveryTerms;
  termination: TerminationTerms;
  obligations: Obligation[];
  warranties?: Warranty[];
  liabilities?: LiabilityClause[];
  penalties?: Penalty[];
  specialConditions?: string[];
}

export interface ContractDuration {
  value: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
  autoRenew: boolean;
  renewalTerm?: ContractDuration;
  noticePeriod?: number;
}

export interface PaymentTerms {
  amount: number;
  currency: string;
  schedule: PaymentSchedule[];
  method: 'prepaid' | 'postpaid' | 'escrow' | 'milestone' | 'subscription';
  creditPeriod?: number;
  lateFeePercentage?: number;
  currencyConversion?: string;
}

export interface PaymentSchedule {
  milestone: string;
  amount: number;
  percentage: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  paidAt?: string;
}

export interface DeliveryTerms {
  method: 'pickup' | 'delivery' | 'digital' | 'service';
  location?: string;
  timeline: DeliveryTimeline;
  inspectionPeriod?: number;
  acceptanceCriteria?: string[];
}

export interface DeliveryTimeline {
  expectedDate?: string;
  leadTime?: number;
  milestones?: DeliveryMilestone[];
}

export interface DeliveryMilestone {
  milestone: string;
  expectedDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

export interface TerminationTerms {
  noticePeriod: number;
  terminationClause: string;
  terminationRights: TerminationRight[];
  penalties: TerminationPenalty[];
}

export interface TerminationRight {
  party: string;
  canTerminate: boolean;
  reason?: string;
  penalties?: string[];
}

export interface TerminationPenalty {
  reason: string;
  penaltyType: 'none' | 'flat_fee' | 'percentage' | 'loss_of_benefits';
  penaltyAmount?: number;
}

export interface Obligation {
  party: string;
  description: string;
  type: 'delivery' | 'payment' | 'compliance' | 'reporting' | 'maintenance' | 'custom';
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'breached';
  completedAt?: string;
}

export interface Warranty {
  warrantyId: string;
  description: string;
  duration: ContractDuration;
  scope: 'limited' | 'standard' | 'extended';
  claims?: WarrantyClaim[];
}

export interface WarrantyClaim {
  claimId: string;
  filedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'resolved';
  resolution?: string;
}

export interface LiabilityClause {
  clauseId: string;
  description: string;
  limitationType: 'unlimited' | 'limited' | 'capped';
  capAmount?: number;
  exclusions?: string[];
}

export interface Penalty {
  penaltyId: string;
  triggerCondition: string;
  penaltyType: 'warning' | 'fine' | 'suspension' | 'termination';
  amount?: number;
  affectedParty?: string;
}

export interface ContractTimeline {
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  signedAt?: string;
  activatedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  terminatedAt?: string;
}

export interface ContractGovernance {
  version: number;
  governingLaw: string;
  jurisdiction: string;
  disputeResolution: DisputeResolution;
  amendmentPolicy: AmendmentPolicy;
  forceMajeure: ForceMajeureClause;
}

export interface DisputeResolution {
  method: 'arbitration' | 'mediation' | 'litigation' | 'negotiation';
  venue?: string;
  arbitrator?: string;
  timeline: number;
}

export interface AmendmentPolicy {
  amendmentsAllowed: boolean;
  approvalRequired: string[];
  versionControl: boolean;
  unilateral?: boolean;
}

export interface ForceMajeureClause {
  enabled: boolean;
  events: string[];
  noticePeriod: number;
  consequences: string[];
}

export interface ContractCreationRequest {
  contractType: ContractType;
  parties: Omit<ContractParty, 'acceptanceStatus' | 'signedAt'>[];
  terms: ContractTerms;
  metadata?: Record<string, unknown>;
}

export interface ContractFilter {
  status?: ContractStatus[];
  contractType?: ContractType[];
  partyId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface ContractAnalytics {
  totalContracts: number;
  byStatus: Record<ContractStatus, number>;
  byType: Record<ContractType, number>;
  activeCount: number;
  expiringCount: number;
  disputedCount: number;
  totalValue: number;
  averageValue: number;
}
