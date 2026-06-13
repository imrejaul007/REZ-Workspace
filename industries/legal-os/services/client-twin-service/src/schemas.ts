import { z } from 'zod';

// Entity Types
export const EntityType = z.enum(['LLC', 'Corporation', 'Partnership', 'Sole Proprietorship', 'Individual']);
export type EntityType = z.infer<typeof EntityType>;

// Client Status
export const ClientStatus = z.enum(['Active', 'Inactive', 'Prospect', 'Onboarding']);
export type ClientStatus = z.infer<typeof ClientStatus>;

// Risk Profile
export const RiskProfile = z.enum(['Low', 'Medium', 'High', 'Critical']);
export type RiskProfile = z.infer<typeof RiskProfile>;

// Fee Structure
export const FeeStructure = z.enum(['Hourly', 'Fixed', 'Contingency', 'Hybrid']);
export type FeeStructure = z.infer<typeof FeeStructure>;

// Primary Contact Schema
export const PrimaryContactSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  role: z.string()
});
export type PrimaryContact = z.infer<typeof PrimaryContactSchema>;

// Billing Info Schema
export const BillingInfoSchema = z.object({
  billingAddress: z.string(),
  paymentTerms: z.string(),
  feeStructure: FeeStructure
});
export type BillingInfo = z.infer<typeof BillingInfoSchema>;

// Client Preferences Schema
export const ClientPreferencesSchema = z.object({
  communicationStyle: z.string(),
  preferredAttorneys: z.array(z.string()),
  matterPriority: z.string()
});
export type ClientPreferences = z.infer<typeof ClientPreferencesSchema>;

// Client Twin Schema
export const ClientTwinSchema = z.object({
  clientId: z.string().uuid(),
  legalName: z.string(),
  dbaName: z.string().optional(),
  entityType: EntityType,
  jurisdiction: z.string(),
  dateOfOnboarding: z.string().datetime(),
  clientStatus: ClientStatus,
  riskProfile: RiskProfile,
  primaryContact: PrimaryContactSchema,
  billingInfo: BillingInfoSchema,
  preferences: ClientPreferencesSchema.optional(),
  relationships: z.object({
    HAS_MATTER: z.array(z.string()).default([]),
    HAS_DOCUMENT: z.array(z.string()).default([]),
    WORKS_WITH: z.array(z.string()).default([])
  }).optional()
});
export type ClientTwin = z.infer<typeof ClientTwinSchema>;

// Input Types (without generated fields)
export const ClientCreateInput = ClientTwinSchema.omit({
  clientId: true,
  dateOfOnboarding: true,
  relationships: true
});
export type ClientCreateInput = z.infer<typeof ClientCreateInput>;

export const ClientUpdateInput = ClientTwinSchema.partial();
export type ClientUpdateInput = z.infer<typeof ClientUpdateInput>;

// Clio Integration Types
export interface ClioMatter {
  id: string;
  displayNumber: string;
  description: string;
  status: 'open' | 'closed';
  clientId: string;
}

export interface ClioContact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// REZ CRM Types
export interface REZCustomer {
  customerId: string;
  name: string;
  type: 'LEGAL_CLIENT';
  attributes: {
    entityType?: EntityType;
    jurisdiction?: string;
    riskProfile?: RiskProfile;
    feeStructure?: FeeStructure;
  };
}

export interface CRMEvent {
  type: string;
  customerId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}
