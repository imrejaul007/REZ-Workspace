
/**
 * Onboarding V2 API Routes
 * Streamlined merchant onboarding - 4 steps to activation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db';
import { encrypt, decrypt } from '../utils/encryption';
import { verifyPaymentAccount } from '../services/payment-verification';
import { generateQRCode } from '../services/qr-generator';

const router = Router();

// Validation middleware
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Types
interface OnboardingSession {
  id: string;
  merchantId: string;
  currentStep: number;
  completedSteps: number[];
  businessInfo?;
  serviceSelection?;
  quickSetup?;
  bankDetails?;
  documents?;
  status: 'in_progress' | 'completed' | 'pending_verification' | 'verified';
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store for demo (use Redis in production)
const sessions = new Map<string, OnboardingSession>();

/**
 * POST /onboarding-v2/start
 * Start a new streamlined onboarding session
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const merchantId = req.user?.merchantId || 'demo-merchant';

    // Create new session
    const session: OnboardingSession = {
      id: uuidv4(),
      merchantId,
      currentStep: 1,
      completedSteps: [],
      status: 'in_progress',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    sessions.set(session.id, session);

    res.status(201).json({
      data: {
        id: session.id,
        currentStep: session.currentStep,
        status: session.status,
      },
    });
  } catch (error) {
    console.error('Error starting onboarding:', error);
    res.status(500).json({ error: 'Failed to start onboarding' });
  }
});

/**
 * GET /onboarding-v2/status
 * Get current onboarding status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const merchantId = req.user?.merchantId || 'demo-merchant';

    // Find existing session
    let session: OnboardingSession | undefined;
    for (const s of sessions.values()) {
      if (s.merchantId === merchantId && s.status === 'in_progress') {
        session = s;
        break;
      }
    }

    if (!session) {
      return res.status(404).json({ error: 'No active onboarding session found' });
    }

    res.json({ data: session });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * PUT /onboarding-v2/step-1
 * Save business + store info (Step 1)
 */
router.put(
  '/step-1',
  [
    body('businessName').isString().notEmpty(),
    body('ownerName').isString().notEmpty(),
    body('phone').isString().isLength({ min: 10, max: 10 }),
    body('businessType').isString(),
    body('businessCategory').isString(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const merchantId = req.user?.merchantId || 'demo-merchant';
      const businessInfo = req.body;

      // Find or create session
      let session: OnboardingSession | undefined;
      for (const s of sessions.values()) {
        if (s.merchantId === merchantId && s.status === 'in_progress') {
          session = s;
          break;
        }
      }

      if (!session) {
        session = {
          id: uuidv4(),
          merchantId,
          currentStep: 1,
          completedSteps: [],
          status: 'in_progress',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        sessions.set(session.id, session);
      }

      // Update session
      session.businessInfo = businessInfo;
      session.currentStep = 2;
      if (!session.completedSteps.includes(1)) {
        session.completedSteps.push(1);
      }
      session.updatedAt = new Date();

      res.json({
        data: {
          step: session.currentStep,
          completed: session.completedSteps,
        },
      });
    } catch (error) {
      console.error('Error saving business info:', error);
      res.status(500).json({ error: 'Failed to save business info' });
    }
  }
);

/**
 * PUT /onboarding-v2/step-2
 * Save service selection (Step 2)
 */
router.put(
  '/step-2',
  [
    body('onlineOrdering').isBoolean(),
    body('scanAndPay').isBoolean(),
    body('loyaltyStamps').isBoolean(),
    body('menuQr').isBoolean(),
    body('tableReservations').isBoolean(),
    body('delivery').isBoolean(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const merchantId = req.user?.merchantId || 'demo-merchant';
      const serviceSelection = req.body;

      // Find session
      let session: OnboardingSession | undefined;
      for (const s of sessions.values()) {
        if (s.merchantId === merchantId && s.status === 'in_progress') {
          session = s;
          break;
        }
      }

      if (!session) {
        return res.status(404).json({ error: 'No active session' });
      }

      // Update session
      session.serviceSelection = serviceSelection;
      session.currentStep = 3;
      if (!session.completedSteps.includes(2)) {
        session.completedSteps.push(2);
      }
      session.updatedAt = new Date();

      res.json({
        data: {
          step: session.currentStep,
          completed: session.completedSteps,
        },
      });
    } catch (error) {
      console.error('Error saving services:', error);
      res.status(500).json({ error: 'Failed to save services' });
    }
  }
);

/**
 * PUT /onboarding-v2/step-3
 * Save quick setup (Step 3)
 */
router.put('/step-3', async (req: Request, res: Response) => {
  try {
    const merchantId = req.user?.merchantId || 'demo-merchant';
    const quickSetup = req.body;

    // Find session
    let session: OnboardingSession | undefined;
    for (const s of sessions.values()) {
      if (s.merchantId === merchantId && s.status === 'in_progress') {
        session = s;
        break;
      }
    }

    if (!session) {
      return res.status(404).json({ error: 'No active session' });
    }

    // Update session
    session.quickSetup = quickSetup;
    session.currentStep = 4;
    if (!session.completedSteps.includes(3)) {
      session.completedSteps.push(3);
    }
    session.updatedAt = new Date();

    res.json({
      data: {
        step: session.currentStep,
        completed: session.completedSteps,
      },
    });
  } catch (error) {
    console.error('Error saving quick setup:', error);
    res.status(500).json({ error: 'Failed to save quick setup' });
  }
});

/**
 * POST /onboarding-v2/complete
 * Finalize onboarding and activate merchant
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const merchantId = req.user?.merchantId || 'demo-merchant';

    // Find session
    let session: OnboardingSession | undefined;
    for (const s of sessions.values()) {
      if (s.merchantId === merchantId && s.status === 'in_progress') {
        session = s;
        break;
      }
    }

    if (!session) {
      return res.status(404).json({ error: 'No active session' });
    }

    // Check if small business (auto-approve)
    const isSmallBusiness = session.businessInfo?.businessType === 'sole_proprietor';

    if (isSmallBusiness) {
      // Auto-approve for small businesses
      session.status = 'verified';

      // In production: Create merchant record, generate QR codes, etc.
    } else {
      // Require verification for larger businesses
      session.status = 'pending_verification';
    }

    if (!session.completedSteps.includes(4)) {
      session.completedSteps.push(4);
    }
    session.updatedAt = new Date();

    res.json({
      data: {
        status: session.status,
        message: isSmallBusiness
          ? 'Account activated! You can start accepting payments now.'
          : 'Your account is under review. We\'ll notify you within 24 hours.',
      },
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

/**
 * POST /onboarding-v2/auto-approve
 * Quick approval for low-risk merchants
 */
router.post('/auto-approve', async (req: Request, res: Response) => {
  try {
    const merchantId = req.user?.merchantId || 'demo-merchant';

    // Find session
    let session: OnboardingSession | undefined;
    for (const s of sessions.values()) {
      if (s.merchantId === merchantId) {
        session = s;
        break;
      }
    }

    if (!session) {
      return res.status(404).json({ error: 'No session found' });
    }

    // Check eligibility
    const isEligible =
      session.businessInfo?.businessType === 'sole_proprietor' &&
      session.completedSteps.length >= 3;

    if (isEligible) {
      session.status = 'verified';
      session.updatedAt = new Date();
    }

    res.json({
      data: {
        approved: isEligible,
        reason: isEligible ? 'Small business eligible for auto-approval' : 'Manual review required',
      },
    });
  } catch (error) {
    console.error('Error auto-approving:', error);
    res.status(500).json({ error: 'Failed to auto-approve' });
  }
});

/**
 * PUT /onboarding-v2/bank
 * Save optional bank details
 */
router.put(
  '/bank',
  [
    body('accountHolderName').isString().notEmpty(),
    body('accountNumber').isString().isLength({ min: 9, max: 18 }),
    body('ifscCode').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/),
    body('bankName').isString().notEmpty(),
    body('accountType').isIn(['savings', 'current']),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const merchantId = req.user?.merchantId || 'demo-merchant';
      const bankDetails = req.body;

      // Encrypt sensitive data
      const encryptedDetails = {
        ...bankDetails,
        accountNumber: encrypt(bankDetails.accountNumber),
      };

      // Find session and update
      let session: OnboardingSession | undefined;
      for (const s of sessions.values()) {
        if (s.merchantId === merchantId) {
          session = s;
          break;
        }
      }

      if (session) {
        session.bankDetails = encryptedDetails;
        session.updatedAt = new Date();
      }

      res.json({ data: { saved: true } });
    } catch (error) {
      console.error('Error saving bank details:', error);
      res.status(500).json({ error: 'Failed to save bank details' });
    }
  }
);

/**
 * POST /onboarding-v2/documents
 * Upload documents
 */
router.post('/documents', async (req: Request, res: Response) => {
  try {
    const merchantId = req.user?.merchantId || 'demo-merchant';
    const documents = req.body;

    // In production: Upload to S3/Cloud storage
    // const uploaded = await uploadDocuments(documents);

    res.json({
      data: {
        uploaded: Object.keys(documents),
      },
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

/**
 * GET /onboarding-v2/gstin/:gstin
 * Auto-fill business info from GSTIN
 */
router.get('/gstin/:gstin', async (req: Request, res: Response) => {
  try {
    const { gstin } = req.params;

    // Validate GSTIN format
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
      return res.status(400).json({ error: 'Invalid GSTIN format' });
    }

    // In production: Call GST API
    // const gstData = await callGSTAPI(gstin);

    // Mock response
    const businessInfo = {
      businessName: 'Sample Business Pvt Ltd',
      businessType: 'pvt_ltd',
      address: {
        street: '123 Business Park, Sector 5',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India',
      },
    };

    res.json({ data: businessInfo });
  } catch (error) {
    console.error('Error looking up GSTIN:', error);
    res.status(500).json({ error: 'Failed to lookup GSTIN' });
  }
});

/**
 * POST /onboarding-v2/validate-bank
 * Validate bank account details
 */
router.post('/validate-bank', async (req: Request, res: Response) => {
  try {
    const { accountNumber, ifscCode } = req.body;

    // In production: Call bank verification service
    // const result = await verifyPaymentAccount(accountNumber, ifscCode);

    // Mock response
    const result = {
      ifscValid: /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode),
      accountValid: /^\d{9,18}$/.test(accountNumber),
      bankName: 'State Bank of India',
      branchName: 'Main Branch',
    };

    res.json({ data: result });
  } catch (error) {
    console.error('Error validating bank:', error);
    res.status(500).json({ error: 'Failed to validate bank details' });
  }
});

/**
 * POST /onboarding-v2/generate-qr
 * Generate QR codes for selected services
 */
router.post('/generate-qr', async (req: Request, res: Response) => {
  try {
    const merchantId = req.user?.merchantId || 'demo-merchant';
    const { services } = req.body;

    // Find session
    let session: OnboardingSession | undefined;
    for (const s of sessions.values()) {
      if (s.merchantId === merchantId) {
        session = s;
        break;
      }
    }

    const codes: Record<string, string> = {};

    // Generate QR codes based on services
    if (services.includes('menuQr') || services.includes('menu')) {
      codes.menu = `rez://menu/${merchantId}/${Date.now()}`;
    }
    if (services.includes('scanAndPay') || services.includes('payment')) {
      codes.payment = `rez://pay/${merchantId}/${Date.now()}`;
    }
    if (services.includes('tableReservations')) {
      codes.table = `rez://table/${merchantId}/${Date.now()}`;
    }

    // In production: Generate actual QR images
    // for (const [key, url] of Object.entries(codes)) {
    //   codes[key] = await generateQRCode(url);
    // }

    res.json({ data: { codes } });
  } catch (error) {
    console.error('Error generating QR codes:', error);
    res.status(500).json({ error: 'Failed to generate QR codes' });
  }
});

/**
 * PUT /onboarding-v2/progress
 * Auto-save progress
 */
router.put('/progress', async (req: Request, res: Response) => {
  try {
    const merchantId = req.user?.merchantId || 'demo-merchant';
    const progressData = req.body;

    // Find session and update
    let session: OnboardingSession | undefined;
    for (const s of sessions.values()) {
      if (s.merchantId === merchantId) {
        session = s;
        break;
      }
    }

    if (session) {
      Object.assign(session, progressData);
      session.updatedAt = new Date();
    }

    res.json({ data: { saved: true } });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

/**
 * POST /onboarding-v2/reset
 * Reset onboarding
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    const merchantId = req.user?.merchantId || 'demo-merchant';

    // Delete session
    for (const [id, s] of sessions.entries()) {
      if (s.merchantId === merchantId) {
        sessions.delete(id);
        break;
      }
    }

    res.json({ data: { reset: true } });
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    res.status(500).json({ error: 'Failed to reset onboarding' });
  }
});

export default router;
