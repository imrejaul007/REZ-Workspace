/**
 * REZ Verify QR - Type Definitions
 */

export interface VerificationResult {
  status: 'AUTHENTIC' | 'INVALID' | 'FLAGGED' | 'SUSPICIOUS';
  serial_number: string;
  brand: string;
  model: string;
  warranty_status?: string;
  warranty_end_date?: string;
  verification_count: number;
  last_verified_at?: string;
  message: string;
}

export interface Warranty {
  id: string;
  serial_number: string;
  brand: string;
  model: string;
  warranty_status: 'ACTIVE' | 'EXPIRED' | 'CLAIMED' | 'TRANSFERRED';
  warranty_start_date: string;
  warranty_end_date: string;
  claim_count: number;
}

export interface Claim {
  id: string;
  serial_number: string;
  warranty_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  issue_type: 'DEFECTIVE' | 'DAMAGED' | 'NOT_WORKING' | 'OTHER';
  description: string;
  created_at: string;
  updated_at: string;
  resolution?: string;
}

export interface Product {
  serial_number: string;
  brand: string;
  model: string;
  category: string;
  manufactured_at: string;
  expiry_date?: string;
  status: 'ACTIVE' | 'DEACTIVATED' | 'RECALLED';
  ownership_status: 'UNOWNED' | 'OWNED' | 'TRANSFERRED';
  verification_count: number;
  last_verified_at?: string;
}

export interface OwnershipPassport {
  serial_number: string;
  current_owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  purchase_date: string;
  warranty_status: string;
  is_original_owner: boolean;
  transfer_count: number;
}

export interface ServiceCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email?: string;
  services: string[];
  distance?: number;
}

export interface ClaimRequest {
  serial_number: string;
  warranty_id: string;
  issue_type: Claim['issue_type'];
  description: string;
  proof_images?: string[];
}

export interface WarrantyPlan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  coverage: string[];
  features: string[];
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
