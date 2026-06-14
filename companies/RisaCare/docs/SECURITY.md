# RisaCare — Security & Compliance Documentation

---

## 1. Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     APPLICATION LAYER                                 │  │
│  │                                                                      │  │
│  │   Input Validation │ Authentication │ Authorization │ Rate Limiting │  │
│  │   XSS Prevention   │ CSRF Protection │ Security Headers │ Audit     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                       DATA LAYER                                     │  │
│  │                                                                      │  │
│  │   Encryption at Rest │ Field-Level Encryption │ Access Controls    │  │
│  │   Data Masking      │ Tokenization         │ Secure Storage       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    INFRASTRUCTURE LAYER                              │  │
│  │                                                                      │  │
│  │   TLS 1.3 │ VPC │ WAF │ DDoS Protection │ Network Segmentation    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Authorization

### 2.1 Authentication Flow

```typescript
// Multi-factor authentication for healthcare access
const authFlow = {
  step1: 'User submits credentials (email/phone + password)',
  step2: 'RABTUL Auth verifies credentials',
  step3: 'Generate short-lived JWT (15 min) + refresh token (7 days)',
  step4: 'For sensitive actions: prompt biometric/PIN verification',
  step5: 'Load user health profile with scoped access',
  step6: 'Log authentication event to audit trail'
};

// JWT Structure for Health
interface HealthJWT {
  sub: string;          // userId
  type: 'access' | 'refresh';
  scope: string[];       // e.g., ['health:read', 'health:write', 'health:emergency']
  profileAccess: string[]; // Which profiles can be accessed
  iat: number;
  exp: number;
  iss: 'rez-auth';
  jti: string;          // Unique token ID
}

// Biometric verification for sensitive operations
const biometricRequiredFor = [
  'delete_health_record',
  'share_record_with_third_party',
  'view_sensitive_conditions',
  'emergency_data_access',
  'export_all_data',
  'change_emergency_contacts',
  'add_minor_profile'
];
```

### 2.2 Role-Based Access Control (RBAC)

```typescript
// Access roles for health platform
const healthRoles = {
  USER: {
    permissions: [
      'health:read:own',
      'health:write:own',
      'health:read:family',
      'health:write:family',
      'health:emergency:access',
      'health:share:consent'
    ],
    scope: 'Self and managed family profiles'
  },

  FAMILY_MEMBER: {
    permissions: [
      'health:read:own',
      'health:write:own'
    ],
    scope: 'Own profile only'
  },

  DOCTOR: {
    permissions: [
      'health:read:shared',
      'health:read:emergency',
      'health:write:notes',
      'health:write:prescription'
    ],
    scope: 'Only shared/emergency records'
  },

  LAB_TECHNICIAN: {
    permissions: [
      'health:read:shared',
      'health:write:lab_results'
    ],
    scope: 'Only lab-related data'
  },

  ADMIN: {
    permissions: [
      'health:read:all',
      'health:write:all',
      'health:delete:all',
      'health:export:all',
      'health:audit:view'
    ],
    scope: 'All data for support/operations'
  },

  CORPORATE_ADMIN: {
    permissions: [
      'health:read:anonymous',
      'health:read:corporate_users',
      'health:analytics:corporate'
    ],
    scope: 'Anonymous employee health data'
  }
};

// Emergency access override
const emergencyAccess = {
  trigger: 'Verified emergency situation',
  permissions: [
    'health:read:emergency',
    'health:emergency_contacts:notify'
  ],
  conditions: [
    'User consent previously given',
    'Audit log entry required',
    'Notification to user after access',
    'Time-limited (30 minutes auto-expire)'
  ]
};
```

### 2.3 Family Profile Access Control

```typescript
// Access matrix for family profiles
interface FamilyAccessControl {
  // Who can access what
  accessMatrix: {
    manager: {
      // Parent managing child's profile
      canRead: true,
      canWrite: true,
      canShare: true,
      canDelete: false, // Requires explicit consent
      canViewSensitive: true // With biometric verification
    },
    spouse: {
      // Spouse accessing spouse's profile
      canRead: true,
      canWrite: false, // Only self can write
      canShare: false, // Only self can share
      canDelete: false,
      canViewSensitive: false // Not without explicit permission
    },
    adultChild: {
      // Adult managing elderly parent's profile
      canRead: true,
      canWrite: true,
      canShare: true,
      canDelete: false,
      canViewSensitive: true // With parent's PIN/biometric
    }
  },

  // Minor-specific rules
  minorRules: {
    ageUnder12: {
      parentGuardian: 'full_control',
      child: 'no_direct_access'
    },
    age12to18: {
      parentGuardian: 'supervised_access',
      child: 'limited_self_access', // Can log symptoms, view basic health
      parentalConsent: 'required_for_sharing'
    }
  }
};
```

---

## 3. Data Protection

### 3.1 Encryption Standards

```typescript
// Encryption configuration
const encryptionConfig = {
  // Data at rest (AES-256-GCM)
  atRest: {
    algorithm: 'AES-256-GCM',
    keySource: 'aws-kms', // or 'gcp-kms'
    keyRotationDays: 90,
    encryptedFields: [
      'health.allergies',
      'health.chronicConditions',
      'health.currentMedications',
      'extracted.rawText', // Full OCR text
      'emergencyContacts.phone',
      'familyHistory',
      'menstrualProfile'
    ]
  },

  // Data in transit (TLS 1.3)
  inTransit: {
    minVersion: 'TLS 1.3',
    cipherSuites: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256'
    ],
    certificatePinning: true
  },

  // Field-level encryption for highly sensitive data
  fieldLevel: {
    algorithm: 'AES-256-GCM',
    keyPerField: true,
    fields: [
      'mentalHealthNotes',
      'hivStatus',
      'sexualHealth',
      'geneticInformation'
    ]
  },

  // Backup encryption
  backup: {
    encryption: 'AES-256',
    keySeparation: true,
    keyRotationDays: 30
  }
};

// Key management
const keyManagement = {
  provider: 'aws-kms', // or 'gcp-kms'
  keyHierarchy: {
    masterKey: 'AWS-managed CMK',
    dataKeys: 'Customer-managed keys',
    fieldKeys: 'Key per sensitive field'
  },
  rotationPolicy: {
    automatic: true,
    frequencyDays: 90,
    gracePeriodDays: 30
  }
};
```

### 3.2 Data Classification

```typescript
// Data classification levels
const dataClassification = {
  PUBLIC: {
    description: 'Intentionally public information',
    examples: ['Business name', 'Public ratings'],
    protection: 'Standard transport encryption'
  },

  INTERNAL: {
    description: 'Internal business data',
    examples: ['Doctor directory', 'Lab information'],
    protection: 'TLS + basic access controls'
  },

  CONFIDENTIAL: {
    description: 'User-provided personal data',
    examples: ['Name', 'Age', 'Basic health info', 'Appointments'],
    protection: 'TLS + encryption + access logging'
  },

  RESTRICTED: {
    description: 'Highly sensitive health information',
    examples: [
      'Medical conditions',
      'Medications',
      'Lab results',
      'Mental health notes'
    ],
    protection: 'Field-level encryption + biometric + audit'
  },

  CRITICAL: {
    description: 'Most sensitive personal data',
    examples: [
      'HIV status',
      'Genetic information',
      'Substance abuse records',
      'Psychiatric records'
    ],
    protection: 'Additional consent + separate encryption key + enhanced audit'
  }
};
```

### 3.3 Data Retention & Deletion

```typescript
// Retention policies by data type
const retentionPolicy = {
  healthRecords: {
    retention: 'User-controlled (indefinite)',
    minimumDays: 0,
    maximumDays: 'Indefinite',
    userAction: 'Export or delete',
    systemCleanup: 'Notify user before deletion'
  },

  wellnessData: {
    retentionDays: 2555, // 7 years
    anonymizationAfterDays: 2555,
    rationale: 'Medical records retention requirement'
  },

  sessionData: {
    retentionHours: 24,
    anonymizationAfterHours: 24
  },

  tempUploads: {
    retentionHours: 24,
    autoDelete: true,
    notification: 'User notified before deletion'
  },

  dataExports: {
    retentionDays: 7,
    autoDelete: true
  },

  auditLogs: {
    retentionDays: 2555, // 7 years
    anonymizationAfterDays: 2555,
    rationale: 'Compliance and legal requirements'
  },

  anonymizedAnalytics: {
    retentionDays: 'Indefinite',
    personallyIdentifiableFields: 'Removed'
  }
};

// Deletion request handling
interface DeletionRequest {
  requestId: string;
  userId: string;
  scope: 'full' | 'partial';
  specificData?: string[]; // If partial
  reason?: string;
  requestedAt: Date;
  scheduledDeletionAt: Date; // 30 days from request
  gracePeriodEndsAt: Date; // User can cancel until here
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  dataToDelete: {
    records: number;
    appointments: number;
    wellnessData: number;
    sharedData: boolean;
    thirdPartyShared: string[];
  };
}
```

---

## 4. API Security

### 4.1 API Authentication

```typescript
// Authentication methods
const authMethods = {
  // Primary: JWT Bearer tokens
  bearerToken: {
    header: 'Authorization: Bearer <token>',
    tokenLifetime: '15 minutes',
    refreshTokenLifetime: '7 days',
    rotationOnUse: true
  },

  // Secondary: API keys (for service-to-service)
  apiKey: {
    header: 'X-API-Key',
    rotation: '90 days',
    scopes: 'Service-specific'
  },

  // Internal: Service tokens
  internalServiceToken: {
    header: 'X-Internal-Token',
    for: 'REZ ecosystem services only',
    validation: 'Token whitelist check'
  }
};

// Request signing for high-value operations
const requestSigning = {
  requiredFor: [
    'create_payment',
    'share_record',
    'delete_record',
    'emergency_access',
    'bulk_data_export'
  ],
  algorithm: 'HMAC-SHA256',
  signatureHeader: 'X-Signature',
  timestampHeader: 'X-Timestamp',
  timestampTolerance: 300 // 5 minutes
};
```

### 4.2 Rate Limiting

```typescript
// Rate limit configuration
const rateLimits = {
  // Per-user limits
  perUser: {
    // API endpoints
    recordUpload: { limit: 50, window: '1 hour' },
    aiInterpretations: { limit: 100, window: '1 hour' },
    symptomQueries: { limit: 30, window: '1 hour' },
    doctorSearch: { limit: 100, window: '1 hour' },
    bookings: { limit: 10, window: '1 hour' },
    labOrders: { limit: 10, window: '1 hour' },

    // Sensitive operations (higher scrutiny)
    deleteRecord: { limit: 5, window: '1 hour', requireBiometric: true },
    shareRecord: { limit: 10, window: '1 hour', requireBiometric: true },
    exportData: { limit: 2, window: '1 hour', requireBiometric: true }
  },

  // Per-IP limits (fraud prevention)
  perIP: {
    standard: { limit: 500, window: '1 hour' },
    auth: { limit: 10, window: '15 minutes' }, // Login attempts
    upload: { limit: 100, window: '1 hour' }
  },

  // Global limits
  global: {
    ocrRequests: { limit: 1000, window: '1 minute' },
    aiRequests: { limit: 2000, window: '1 minute' }
  }
};

// Rate limit response headers
const rateLimitHeaders = {
  'X-RateLimit-Limit': 'Maximum requests allowed',
  'X-RateLimit-Remaining': 'Requests remaining',
  'X-RateLimit-Reset': 'Unix timestamp when limit resets',
  'Retry-After': 'Seconds to wait (on 429)'
};
```

### 4.3 Input Validation

```typescript
// Zod validation schemas
import { z } from 'zod';

const validationSchemas = {
  // Health record upload
  uploadRecord: z.object({
    profileId: z.string().uuid(),
    type: z.enum([
      'blood_report', 'urine_report', 'xray', 'ct_scan', 'mri',
      'ultrasound', 'ecg', 'prescription', 'discharge_summary', 'other'
    ]),
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional()
  }),

  // Profile update
  updateProfile: z.object({
    profileId: z.string().uuid(),
    health: z.object({
      allergies: z.array(z.object({
        allergen: z.string().min(1).max(100),
        type: z.enum(['food', 'medication', 'environmental', 'other']),
        severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening'])
      })).max(50),
      chronicConditions: z.array(z.object({
        name: z.string().min(1).max(100),
        diagnosedDate: z.string().datetime(),
        status: z.enum(['active', 'managed', 'resolved'])
      })).max(20)
    }).partial()
  }),

  // Appointment booking
  createAppointment: z.object({
    profileId: z.string().uuid(),
    providerType: z.enum(['doctor', 'lab', 'pharmacy', 'wellness']),
    providerId: z.string(),
    schedule: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      mode: z.enum(['in_clinic', 'teleconsult', 'home_visit'])
    })
  }),

  // AI symptom assessment
  assessSymptoms: z.object({
    profileId: z.string().uuid(),
    symptoms: z.array(z.object({
      symptom: z.string().min(1).max(200),
      duration: z.string().max(50).optional(),
      severity: z.number().int().min(1).max(5).optional(),
      location: z.string().max(100).optional()
    })).min(1).max(10)
  })
};
```

---

## 5. Privacy & Consent

### 5.1 Consent Management

```typescript
// Consent categories
const consentCategories = {
  DATA_COLLECTION: {
    id: 'data_collection',
    name: 'Health Data Collection',
    description: 'Allow RisaCare to collect and store your health records',
    required: true,
    canWithdraw: true
  },

  ANALYTICS: {
    id: 'analytics',
    name: 'Anonymous Analytics',
    description: 'Allow anonymized analytics to improve our services',
    required: false,
    canWithdraw: true
  },

  RESEARCH: {
    id: 'research',
    name: 'Research Participation',
    description: 'Allow your anonymized data to contribute to health research',
    required: false,
    canWithdraw: true,
    additionalConsent: true // Requires explicit opt-in
  },

  THIRD_PARTY_SHARING: {
    id: 'third_party',
    name: 'Healthcare Provider Sharing',
    description: 'Share your records with doctors and healthcare providers',
    required: false, // Per-sharing consent required
    canWithdraw: true,
    perInstanceConsent: true
  },

  MARKETING: {
    id: 'marketing',
    name: 'Wellness Recommendations',
    description: 'Receive personalized health and wellness recommendations',
    required: false,
    canWithdraw: true
  }
};

// Consent record
interface ConsentRecord {
  id: string;
  userId: string;
  version: string; // Consent form version
  consents: {
    [categoryId: string]: {
      given: boolean;
      givenAt: string;
      withdrawnAt?: string;
      method: 'explicit' | 'implicit';
      ipAddress?: string;
      userAgent?: string;
    }
  };
  signature?: string; // For sensitive consents
}
```

### 5.2 Data Sharing Controls

```typescript
// Record sharing configuration
interface RecordSharing {
  // Before any sharing
  preconditions: [
    'User must give explicit consent',
    'Share must be for healthcare purpose',
    'Time-limited access (default 7 days)',
    'User can revoke anytime'
  ],

  // Sharing options
  sharingTypes: {
    doctorSharing: {
      description: 'Share with your doctor',
      duration: '7 days default, configurable',
      scope: ['records', 'prescriptions', 'history'],
      requiresConsent: true,
      doctorMustAccept: true
    },

    labSharing: {
      description: 'Share with diagnostic labs',
      duration: 'Single use',
      scope: ['prescriptions'],
      requiresConsent: true
    },

    emergencySharing: {
      description: 'Emergency medical access',
      duration: '30 minutes',
      scope: ['allergies', 'conditions', 'medications', 'emergency_contacts'],
      requiresConsent: 'Previously given',
      auditRequired: true,
      userNotificationAfter: true
    },

    familySharing: {
      description: 'Share with family member',
      duration: 'Permanent (until revoked)',
      scope: ['full_record'],
      requiresConsent: true,
      consentType: 'explicit_acknowledgment'
    }
  },

  // Sharing audit
  auditRequirements: [
    'Who accessed data',
    'What data was accessed',
    'When it was accessed',
    'Purpose of access',
    'Duration of access'
  ]
};
```

---

## 6. Audit & Compliance

### 6.1 Audit Logging

```typescript
// Audit event types
const auditEvents = {
  // Data access
  DATA_READ: 'health.record.accessed',
  DATA_WRITE: 'health.record.modified',
  DATA_DELETE: 'health.record.deleted',
  DATA_EXPORT: 'health.data.exported',
  DATA_SHARED: 'health.record.shared',
  DATA_SHARING_ACCESSED: 'health.shared.record.accessed',

  // Authentication
  AUTH_SUCCESS: 'auth.login.success',
  AUTH_FAILURE: 'auth.login.failure',
  AUTH_MFA: 'auth.mfa.completed',
  AUTH_LOGOUT: 'auth.logout',

  // Consent
  CONSENT_GIVEN: 'consent.given',
  CONSENT_WITHDRAWN: 'consent.withdrawn',

  // Emergency
  EMERGENCY_ACCESS: 'health.emergency.accessed',
  EMERGENCY_CONTACTS_NOTIFIED: 'health.emergency.contacts_notified',

  // Security
  BIOMETRIC_VERIFIED: 'security.biometric.verified',
  API_KEY_CREATED: 'security.api_key.created',
  API_KEY_REVOKED: 'security.api_key.revoked'
};

// Audit log structure
interface AuditEntry {
  id: string;
  timestamp: string;
  actor: {
    type: 'user' | 'system' | 'admin' | 'api' | 'doctor';
    id: string;
    ip?: string;
    userAgent?: string;
  };
  action: string;
  resource: {
    type: string;
    id: string;
    userId: string;
  };
  outcome: 'success' | 'failure';
  details?: Record<string, unknown>;
  compliance?: {
    consentId?: string;
    basis?: string; // GDPR Article basis
    retention?: string;
  };
}
```

### 6.2 Compliance Checklists

```typescript
// DPDP Act Compliance (India)
const dpdpaCompliance = {
  consent: {
    requirement: 'Explicit, informed consent before data collection',
    implementation: [
      'Consent form with plain language explanation',
      'Separate consent for sensitive data',
      'Easy withdrawal mechanism',
      'Consent versioning and audit trail'
    ]
  },

  purpose: {
    requirement: 'Data collected only for stated purposes',
    implementation: [
      'Purpose limitation in all data collection',
      'Data use audit logging',
      'Prohibition on secondary use without consent'
    ]
  },

  dataMinization: {
    requirement: 'Collect only necessary data',
    implementation: [
      'Data field review process',
      'Unnecessary field removal',
      'Regular data audits'
    ]
  },

  storage: {
    requirement: 'Reasonable security practices',
    implementation: [
      'Encryption at rest and in transit',
      'Access controls and logging',
      'Security incident response plan'
    ]
  },

  deletion: {
    requirement: 'Right to erasure',
    implementation: [
      'Account deletion mechanism',
      'Data deletion within 30 days',
      'Backup cleanup procedures'
    ]
  },

  breachNotification: {
    requirement: 'Notify data principal of breaches',
    implementation: [
      'Incident detection system',
      '72-hour notification process',
      'Remediation procedures'
    ]
  }
};

// HIPAA-inspired Controls (for future compliance)
const hipaaInspire = {
  administrative: [
    'Security management process',
    'Workforce security training',
    'Information access management',
    'Security incident procedures',
    'Contingency planning'
  ],

  physical: [
    'Facility access controls',
    'Workstation security',
    'Device and media controls'
  ],

  technical: [
    'Access control',
    'Audit controls',
    'Integrity controls',
    'Transmission security',
    'Access monitoring'
  ]
};
```

---

## 7. Security Operations

### 7.1 Security Monitoring

```typescript
// Security monitoring configuration
const securityMonitoring = {
  // Real-time alerts
  alerts: {
    critical: [
      'Multiple failed login attempts (>10 in 5 min)',
      'Unauthorized access to sensitive data',
      'Data export exceeding threshold',
      'Emergency access without notification',
      'Anomalous data access patterns'
    ],

    warning: [
      'Rate limit violations',
      'Failed biometric verifications',
      'Unusual API patterns',
      'Consent withdrawal spike',
      'Bulk data access requests'
    ],

    info: [
      'New API key creation',
      'Admin access',
      'Data sharing events',
      'Profile deletions'
    ]
  },

  // Anomaly detection
  anomalyDetection: {
    accessPatterns: {
      metric: 'data_access_per_user',
      baseline: 'historical_average',
      threshold: '3_standard_deviations',
      alertOn: 'unusual_access_times | unusual_volume | unusual_scope'
    },

    exportPatterns: {
      metric: 'data_export_size',
      baseline: 'average_export',
      threshold: '5x_average',
      alertOn: 'large_exports | rapid_exports'
    }
  }
};
```

### 7.2 Incident Response

```typescript
// Security incident response plan
const incidentResponse = {
  severityLevels: {
    P1_CRITICAL: {
      definition: 'Active breach, data exfiltration, ransomware',
      responseTime: '15 minutes',
      escalation: 'CISO, CTO, Legal, CEO'
    },

    P2_HIGH: {
      definition: 'Suspected breach, unauthorized access, system compromise',
      responseTime: '1 hour',
      escalation: 'Security Lead, Engineering Lead'
    },

    P3_MEDIUM: {
      definition: 'Policy violation, attempted breach, system anomaly',
      responseTime: '4 hours',
      escalation: 'Security team'
    },

    P4_LOW: {
      definition: 'Minor security event, configuration issue',
      responseTime: '24 hours',
      escalation: 'Assigned analyst'
    }
  },

  responseSteps: {
    detect: [
      'Automated alerting',
      'Log analysis',
      'User reports'
    ],

    contain: [
      'Isolate affected systems',
      'Revoke compromised credentials',
      'Block malicious actors'
    ],

    eradicate: [
      'Remove malware/threats',
      'Patch vulnerabilities',
      'Reset compromised keys'
    ],

    recover: [
      'Restore from clean backups',
      'Verify system integrity',
      'Resume operations'
    ],

    postIncident: [
      'Root cause analysis',
      'Impact assessment',
      'Remediation plan',
      'Lessons learned',
      'Process improvements'
    ]
  }
};
```

---

## 8. Security Checklist

### Pre-Production Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SECURITY PRE-PRODUCTION CHECKLIST                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AUTHENTICATION & AUTHORIZATION                                              │
│  □ Multi-factor authentication implemented                                    │
│  □ JWT tokens with appropriate expiry                                        │
│  □ Biometric verification for sensitive ops                                   │
│  □ RBAC roles configured                                                    │
│  □ Family profile access controls tested                                      │
│  □ Emergency access override tested                                          │
│                                                                              │
│  DATA PROTECTION                                                             │
│  □ Encryption at rest (AES-256) configured                                   │
│  □ Field-level encryption for sensitive data                                 │
│  □ TLS 1.3 enforced                                                         │
│  □ Key rotation configured                                                   │
│  □ Backup encryption verified                                                │
│                                                                              │
│  API SECURITY                                                                │
│  □ Input validation (Zod) implemented                                        │
│  □ Rate limiting configured                                                  │
│  □ Request signing for high-value ops                                        │
│  □ CORS properly configured                                                  │
│  □ Security headers (HSTS, CSP, etc.) enabled                                │
│                                                                              │
│  PRIVACY & CONSENT                                                           │
│  □ Consent management system implemented                                     │
│  □ Consent audit logging verified                                            │
│  □ Data sharing controls tested                                              │
│  □ Right to deletion mechanism verified                                      │
│  □ Data export functionality tested                                          │
│                                                                              │
│  AUDIT & COMPLIANCE                                                          │
│  □ Audit logging implemented for all sensitive operations                    │
│  □ Audit log integrity verified                                              │
│  □ DPDP Act requirements checklist completed                                  │
│  □ Data retention policies configured                                        │
│                                                                              │
│  MONITORING & INCIDENT RESPONSE                                              │
│  □ Security monitoring alerts configured                                      │
│  □ Anomaly detection enabled                                                 │
│  □ Incident response plan documented                                         │
│  □ Security contact information current                                       │
│                                                                              │
│  PENETRATION TESTING                                                         │
│  □ External penetration test completed                                       │
│  □ API security testing completed                                            │
│  □ Social engineering tests completed                                        │
│  □ Findings remediated and verified                                         │
│                                                                              │
│  COMPLIANCE REVIEW                                                           │
│  □ Security architecture review passed                                       │
│  □ Legal review completed                                                   │
│  □ Privacy impact assessment done                                            │
│  □ Data processing agreement in place                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
