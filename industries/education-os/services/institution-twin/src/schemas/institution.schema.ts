import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Accreditation {
  body: string;
  year: number;
  validUntil?: string;
}

export interface Department {
  id: string;
  name: string;
  headId: string;
  staffCount: number;
}

export interface Program {
  id: string;
  name: string;
  type: 'academic' | 'vocational' | 'corporate';
  duration: number;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

export interface InstitutionTwin {
  twinId: string;
  merchantId: string;
  createdAt: string;
  updatedAt: string;

  identity: {
    name: {
      legal: string;
      display: string;
      acronym: string;
    };
    type: 'school' | 'college' | 'university' | 'training_center' | 'corporate';
    contact: {
      address: Address;
      phone: string;
      email: string;
      website: string;
    };
    accreditations: Accreditation[];
    established: string;
  };

  structure: {
    departments: Department[];
    programs: Program[];
    facilities: Facility[];
    policies: string[];
  };

  people: {
    students: {
      total: number;
      active: number;
      byLevel: Record<string, number>;
    };
    staff: {
      total: number;
      teachers: number;
      admin: number;
      support: number;
    };
    leadership: {
      principal: string;
      heads: Record<string, string>;
    };
  };

  programs: {
    academic: Program[];
    vocational: Program[];
    corporate: Program[];
    online: Program[];
  };

  performance: {
    studentOutcomes: {
      avgGPA: number;
      passRate: number;
      graduationRate: number;
      placementRate: number;
    };
    reputation: {
      brandPulseScore: number;
      reviewsCount: number;
      avgRating: number;
      ranking: number;
    };
    financial: {
      revenue: number;
      expenses: number;
      scholarships: number;
      enrollmentRevenue: number;
    };
  };

  integrations: {
    erp: string | null;
    lms: string | null;
    payment: string | null;
    communication: string[];
  };

  relationships: {
    partners: string[];
    employers: string[];
    vendors: string[];
    alumni: string[];
  };

  financial: {
    walletBalance: number;
    revenueShare: number;
    pendingPayouts: number;
  };

  metadata: {
    createdAt: string;
    status: 'active' | 'inactive' | 'suspended';
    tier: 'basic' | 'professional' | 'enterprise';
  };
}

export const createInstitutionSchema = {
  type: 'object',
  required: ['identity', 'metadata'],
  properties: {
    identity: {
      type: 'object',
      required: ['name', 'type', 'contact'],
      properties: {
        name: {
          type: 'object',
          properties: {
            legal: { type: 'string' },
            display: { type: 'string' },
            acronym: { type: 'string' }
          }
        },
        type: { type: 'string', enum: ['school', 'college', 'university', 'training_center', 'corporate'] },
        contact: {
          type: 'object',
          properties: {
            address: { type: 'object' },
            phone: { type: 'string' },
            email: { type: 'string' },
            website: { type: 'string' }
          }
        },
        accreditations: { type: 'array' },
        established: { type: 'string' }
      }
    },
    metadata: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
        tier: { type: 'string', enum: ['basic', 'professional', 'enterprise'] }
      }
    }
  }
};

export const validateCreateInstitution = ajv.compile(createInstitutionSchema);