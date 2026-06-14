import { logger } from '../../shared/logger';
/**
 * RisaCare ABHA Service
 * Port: 4731 - Aadhaar-Based Health Account (India's Digital Health ID)
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 4731;
const app: Express = express();

// Types
type ABHAServiceType = 'enrollment' | 'linking' | 'verification' | 'profile' | 'consent' | 'records';
type LinkingStatus = 'pending' | 'verified' | 'failed';
type ConsentStatus = 'granted' | 'denied' | 'expired';

interface ABHAAddress {
  email?: string;
  phone: string;
}

interface HealthRecord {
  recordId: string;
  patientId: string;
  abhaNumber: string;
  recordType: string;
  provider: string;
  date: Date;
  summary: string;
  fileUrl?: string;
}

interface LinkedAccount {
  linkId: string;
  patientId: string;
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  state: string;
  district: string;
  status: LinkingStatus;
  linkedAt: Date;
}

interface ConsentRequest {
  consentId: string;
  patientId: string;
  requesterId: string;
  requesterName: string;
  purpose: string;
  hiTypes: string[];
  fromDate: Date;
  toDate: Date;
  status: ConsentStatus;
  grantedAt?: Date;
  expiresAt?: Date;
}

// In-memory storage
const linkedAccounts: Map<string, LinkedAccount> = new Map();
const healthRecords: Map<string, HealthRecord> = new Map();
const consentRequests: Map<string, ConsentRequest> = new Map();

// Seed sample linked accounts
const seedData = () => {
  const sampleAccounts: LinkedAccount[] = [
    {
      linkId: 'LINK-001',
      patientId: 'patient-001',
      abhaNumber: '12-3456-7890-1234',
      abhaAddress: 'john.doe@abha',
      name: 'John Doe',
      dateOfBirth: '1990-05-15',
      gender: 'male',
      state: 'Maharashtra',
      district: 'Mumbai',
      status: 'verified',
      linkedAt: new Date('2025-01-15'),
    },
    {
      linkId: 'LINK-002',
      patientId: 'patient-002',
      abhaNumber: '98-7654-3210-9876',
      abhaAddress: 'jane.smith@abha',
      name: 'Jane Smith',
      dateOfBirth: '1985-08-22',
      gender: 'female',
      state: 'Karnataka',
      district: 'Bangalore',
      status: 'verified',
      linkedAt: new Date('2025-02-20'),
    },
  ];
  sampleAccounts.forEach(acc => linkedAccounts.set(acc.linkId, acc));
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-abha',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'RisaCare ABHA Service',
    version: '1.0.0',
    port: PORT,
    description: 'Aadhaar-Based Health Account - India Digital Health ID integration',
    endpoints: {
      health: 'GET /health',
      abha: {
        create: 'POST /api/abha',
        verify: 'POST /api/abha/verify',
        link: 'POST /api/abha/link',
        get: 'GET /api/abha/:abhaNumber',
        patient: 'GET /api/abha/patient/:patientId',
      },
      profile: {
        get: 'GET /api/abha/profile/:linkId',
        update: 'PUT /api/abha/profile/:linkId',
      },
      consent: {
        request: 'POST /api/consent/request',
        grant: 'POST /api/consent/:consentId/grant',
        deny: 'POST /api/consent/:consentId/deny',
        list: 'GET /api/consent/patient/:patientId',
      },
      records: {
        add: 'POST /api/records',
        list: 'GET /api/records/:abhaNumber',
        share: 'POST /api/records/:recordId/share',
      },
    },
  });
});

// Helper functions
const generateABHANumber = (): string => {
  const part1 = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
  const part2 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  const part3 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  const part4 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${part1}-${part2}-${part3}-${part4}`;
};

const generateABHAAddress = (name: string): string => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  return `${cleanName}@abha`;
};

// ============== ABHA ENDPOINTS ==============

/**
 * POST /api/abha - Create new ABHA
 */
app.post('/api/abha', (req: Request, res: Response) => {
  const { patientId, name, dateOfBirth, gender, phone, email, address } = req.body;

  if (!patientId || !name || !dateOfBirth || !gender || !phone) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
    });
  }

  const abhaNumber = generateABHANumber();
  const abhaAddress = generateABHAAddress(name);

  const account: LinkedAccount = {
    linkId: `LINK-${uuidv4().substring(0, 8).toUpperCase()}`,
    patientId,
    abhaNumber,
    abhaAddress,
    name,
    dateOfBirth,
    gender,
    state: address?.state || 'Maharashtra',
    district: address?.district || 'Mumbai',
    status: 'pending',
    linkedAt: new Date(),
  };

  linkedAccounts.set(account.linkId, account);

  res.status(201).json({
    success: true,
    data: {
      account,
      message: 'ABHA created successfully. Verification pending.',
    },
  });
});

/**
 * POST /api/abha/verify - Verify ABHA via OTP
 */
app.post('/api/abha/verify', (req: Request, res: Response) => {
  const { abhaNumber, otp } = req.body;

  if (!abhaNumber || !otp) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ABHA number and OTP required' },
    });
  }

  // Simulate OTP verification
  const account = Array.from(linkedAccounts.values()).find(a => a.abhaNumber === abhaNumber);

  if (!account) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ABHA not found' },
    });
  }

  if (otp.length === 6) {
    account.status = 'verified';
    linkedAccounts.set(account.linkId, account);

    res.json({
      success: true,
      data: {
        account,
        message: 'ABHA verified successfully',
      },
    });
  } else {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_OTP', message: 'Invalid OTP' },
    });
  }
});

/**
 * POST /api/abha/link - Link existing ABHA
 */
app.post('/api/abha/link', (req: Request, res: Response) => {
  const { patientId, abhaNumber, abhaAddress, name, dateOfBirth, gender } = req.body;

  if (!patientId || !abhaNumber) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'patientId and abhaNumber required' },
    });
  }

  const account: LinkedAccount = {
    linkId: `LINK-${uuidv4().substring(0, 8).toUpperCase()}`,
    patientId,
    abhaNumber,
    abhaAddress: abhaAddress || generateABHAAddress(name || 'user'),
    name: name || 'Unknown',
    dateOfBirth: dateOfBirth || '1990-01-01',
    gender: gender || 'other',
    state: 'Maharashtra',
    district: 'Mumbai',
    status: 'verified', // Assumed verified for linking
    linkedAt: new Date(),
  };

  linkedAccounts.set(account.linkId, account);

  res.status(201).json({
    success: true,
    data: {
      account,
      message: 'ABHA linked successfully',
    },
  });
});

/**
 * GET /api/abha/:abhaNumber - Get ABHA details
 */
app.get('/api/abha/:abhaNumber', (req: Request, res: Response) => {
  const { abhaNumber } = req.params;
  const account = Array.from(linkedAccounts.values()).find(a => a.abhaNumber === abhaNumber);

  if (!account) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'ABHA not found' },
    });
  }

  res.json({ success: true, data: account });
});

/**
 * GET /api/abha/patient/:patientId - Get patient's ABHA
 */
app.get('/api/abha/patient/:patientId', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const accounts = Array.from(linkedAccounts.values()).filter(a => a.patientId === patientId);

  res.json({
    success: true,
    data: { accounts, count: accounts.length },
  });
});

// ============== PROFILE ENDPOINTS ==============

/**
 * GET /api/abha/profile/:linkId - Get profile
 */
app.get('/api/abha/profile/:linkId', (req: Request, res: Response) => {
  const { linkId } = req.params;
  const account = linkedAccounts.get(linkId);

  if (!account) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Profile not found' },
    });
  }

  // Return masked profile for privacy
  res.json({
    success: true,
    data: {
      linkId: account.linkId,
      abhaNumber: maskABHA(account.abhaNumber),
      abhaAddress: account.abhaAddress,
      name: account.name,
      dateOfBirth: account.dateOfBirth,
      gender: account.gender,
      state: account.state,
      district: account.district,
      status: account.status,
      linkedAt: account.linkedAt,
    },
  });
});

/**
 * PUT /api/abha/profile/:linkId - Update profile
 */
app.put('/api/abha/profile/:linkId', (req: Request, res: Response) => {
  const { linkId } = req.params;
  const account = linkedAccounts.get(linkId);

  if (!account) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Profile not found' },
    });
  }

  const { name, email, phone, address } = req.body;

  if (name) account.name = name;
  if (address?.state) account.state = address.state;
  if (address?.district) account.district = address.district;

  linkedAccounts.set(linkId, account);

  res.json({
    success: true,
    data: { account },
  });
});

// Helper to mask ABHA number
function maskABHA(abhaNumber: string): string {
  const parts = abhaNumber.split('-');
  return `${parts[0]}-****-****-${parts[3]}`;
}

// ============== CONSENT ENDPOINTS ==============

/**
 * POST /api/consent/request - Request health data consent
 */
app.post('/api/consent/request', (req: Request, res: Response) => {
  const { patientId, requesterId, requesterName, purpose, hiTypes, fromDate, toDate } = req.body;

  if (!patientId || !requesterId || !purpose || !hiTypes?.length) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
    });
  }

  const consentRequest: ConsentRequest = {
    consentId: `CONS-${uuidv4().substring(0, 8).toUpperCase()}`,
    patientId,
    requesterId,
    requesterName: requesterName || 'Healthcare Provider',
    purpose,
    hiTypes,
    fromDate: fromDate ? new Date(fromDate) : new Date(),
    toDate: toDate ? new Date(toDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'pending',
  };

  consentRequests.set(consentRequest.consentId, consentRequest);

  res.status(201).json({
    success: true,
    data: {
      consent: consentRequest,
      message: 'Consent request submitted',
    },
  });
});

/**
 * POST /api/consent/:consentId/grant - Grant consent
 */
app.post('/api/consent/:consentId/grant', (req: Request, res: Response) => {
  const { consentId } = req.params;
  const consent = consentRequests.get(consentId);

  if (!consent) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Consent request not found' },
    });
  }

  consent.status = 'granted';
  consent.grantedAt = new Date();
  consent.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  consentRequests.set(consentId, consent);

  res.json({
    success: true,
    data: { consent },
    message: 'Consent granted',
  });
});

/**
 * POST /api/consent/:consentId/deny - Deny consent
 */
app.post('/api/consent/:consentId/deny', (req: Request, res: Response) => {
  const { consentId } = req.params;
  const consent = consentRequests.get(consentId);

  if (!consent) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Consent request not found' },
    });
  }

  consent.status = 'denied';
  consentRequests.set(consentId, consent);

  res.json({
    success: true,
    data: { consent },
    message: 'Consent denied',
  });
});

/**
 * GET /api/consent/patient/:patientId - Get patient's consent requests
 */
app.get('/api/consent/patient/:patientId', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { status } = req.query;

  let consents = Array.from(consentRequests.values()).filter(c => c.patientId === patientId);

  if (status) {
    consents = consents.filter(c => c.status === status);
  }

  res.json({
    success: true,
    data: { consents, count: consents.length },
  });
});

// ============== RECORDS ENDPOINTS ==============

/**
 * POST /api/records - Add health record to ABHA
 */
app.post('/api/records', (req: Request, res: Response) => {
  const { patientId, abhaNumber, recordType, provider, date, summary, fileUrl } = req.body;

  if (!patientId || !abhaNumber || !recordType || !provider) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
    });
  }

  const record: HealthRecord = {
    recordId: `REC-${uuidv4().substring(0, 8).toUpperCase()}`,
    patientId,
    abhaNumber,
    recordType,
    provider,
    date: date ? new Date(date) : new Date(),
    summary,
    fileUrl,
  };

  healthRecords.set(record.recordId, record);

  res.status(201).json({
    success: true,
    data: { record },
  });
});

/**
 * GET /api/records/:abhaNumber - Get health records
 */
app.get('/api/records/:abhaNumber', (req: Request, res: Response) => {
  const { abhaNumber } = req.params;
  const { type, from, to } = req.query;

  let records = Array.from(healthRecords.values())
    .filter(r => r.abhaNumber === abhaNumber);

  if (type) {
    records = records.filter(r => r.recordType === type);
  }

  if (from) {
    records = records.filter(r => new Date(r.date) >= new Date(from as string));
  }

  if (to) {
    records = records.filter(r => new Date(r.date) <= new Date(to as string));
  }

  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({
    success: true,
    data: { records, count: records.length },
  });
});

/**
 * POST /api/records/:recordId/share - Share record via ABHA
 */
app.post('/api/records/:recordId/share', (req: Request, res: Response) => {
  const { recordId } = req.params;
  const { targetAbhaAddress, consentId } = req.body;

  const record = healthRecords.get(recordId);

  if (!record) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Record not found' },
    });
  }

  // Verify consent
  if (consentId) {
    const consent = consentRequests.get(consentId);
    if (!consent || consent.status !== 'granted') {
      return res.status(400).json({
        success: false,
        error: { code: 'CONSENT_REQUIRED', message: 'Valid consent required to share records' },
      });
    }
  }

  // Simulate share (would integrate with NDHA gateway)
  const shareToken = uuidv4();

  res.json({
    success: true,
    data: {
      recordId,
      targetAbhaAddress,
      shareToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      message: 'Record shared successfully',
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`[ERROR] ${err.message}`);
  res.status(500).json({ success: false, error: err.message });
});

// Initialize
seedData();

// Start server
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║       RisaCare ABHA Service                      ║
╠═══════════════════════════════════════════════════════════╣
║  Status:     RUNNING                                ║
║  Port:       ${PORT.toString().padEnd(43)}║
║  Version:    1.0.0                               ║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                        ║
║    - ABHA creation & verification               ║
║    - Health record management                   ║
║    - Consent management                         ║
║    - Data sharing via ABHA address             ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export { app };
