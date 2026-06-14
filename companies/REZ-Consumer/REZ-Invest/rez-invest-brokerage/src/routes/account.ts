import { Router, Request, Response } from 'express';
import { z } from 'zod';

export const accountRouter = Router();

// Types
interface Account {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  pan: string;
  aadhar: string;
  kycStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  segments: string[];
  dpClientId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface KYCInfo {
  pan: { status: string; verifiedAt?: Date };
  aadhar: { status: string; verifiedAt?: Date };
  bank: { status: string; verifiedAt?: Date };
  signature: { status: string; verifiedAt?: Date };
}

// Mock data store
const accounts = new Map<string, Account>();
const kycInfos = new Map<string, KYCInfo>();

// Initialize mock account
const mockAccount: Account = {
  id: 'acc_123',
  userId: 'user_123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+919876543210',
  pan: 'ABCDE1234F',
  aadhar: 'XXXX-XXXX-1234',
  kycStatus: 'verified',
  segments: ['equity', 'commodity', 'currency'],
  dpClientId: 'DP12345',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
};

accounts.set('user_123', mockAccount);
kycInfos.set('user_123', {
  pan: { status: 'verified', verifiedAt: new Date('2024-01-15') },
  aadhar: { status: 'verified', verifiedAt: new Date('2024-01-15') },
  bank: { status: 'verified', verifiedAt: new Date('2024-01-16') },
  signature: { status: 'verified', verifiedAt: new Date('2024-01-17') },
});

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
});

const submitKYCSchema = z.object({
  pan: z.string().length(10).optional(),
  aadhar: z.string().length(12).optional(),
  bankAccount: z.string().min(8).optional(),
  ifsc: z.string().length(11).optional(),
});

const enableSegmentsSchema = z.object({
  segments: z.array(z.enum(['equity', 'commodity', 'currency', 'futures', 'options'])),
});

// Get account details
accountRouter.get('/', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const account = accounts.get(userId);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  res.json({
    success: true,
    account: {
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone,
      kycStatus: account.kycStatus,
      segments: account.segments,
      dpClientId: account.dpClientId,
      createdAt: account.createdAt,
    },
  });
});

// Update profile
accountRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = updateProfileSchema.parse(req.body);

    const account = accounts.get(userId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Update fields
    if (data.name) account.name = data.name;
    if (data.email) account.email = data.email;
    if (data.phone) account.phone = data.phone;
    account.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        phone: account.phone,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get KYC status
accountRouter.get('/kyc', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const account = accounts.get(userId);
  const kycInfo = kycInfos.get(userId);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  res.json({
    success: true,
    kyc: {
      overallStatus: account.kycStatus,
      details: kycInfo || {},
    },
  });
});

// Submit KYC
accountRouter.post('/kyc', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = submitKYCSchema.parse(req.body);

    const account = accounts.get(userId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // In production, this would trigger KYC verification
    account.kycStatus = 'submitted';
    account.updatedAt = new Date();

    res.json({
      success: true,
      message: 'KYC submitted successfully. Verification in progress.',
      kycStatus: account.kycStatus,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get enabled segments
accountRouter.get('/segments', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const account = accounts.get(userId);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  res.json({
    success: true,
    segments: account.segments,
  });
});

// Enable trading segments
accountRouter.post('/segments', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = enableSegmentsSchema.parse(req.body);

    const account = accounts.get(userId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    account.segments = data.segments;
    account.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Segments updated successfully',
      segments: account.segments,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
