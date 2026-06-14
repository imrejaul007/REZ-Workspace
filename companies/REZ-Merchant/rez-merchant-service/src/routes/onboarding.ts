import { Router, Request, Response } from 'express';
import { Merchant } from '../models/Merchant';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/status', async (req: Request, res: Response) => {
  try {
    const merchant = (await Merchant.findById(req.merchantId).lean()) as (Record<string, unknown> & { onboarding?: Record<string, unknown> }) | null;
    if (!merchant) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    const storeCount = await Store.countDocuments({ merchantId: req.merchantId });
    const onboarding = merchant.onboarding as (Record<string, unknown> & { stepData?: Record<string, unknown>; currentStep?: number; status?: string }) | undefined;
    const stepData = onboarding?.stepData as (Record<string, unknown> & { bankDetails?: Record<string, unknown>; verification?: Record<string, unknown> }) | undefined;
    const steps = {
      profileComplete: !!(merchant.businessName && merchant.ownerName),
      storeCreated: storeCount > 0,
      bankDetailsAdded: !!(stepData?.bankDetails?.accountNumber),
      documentsUploaded: !!(((stepData?.verification as (Record<string, unknown> & { documents?: unknown[] }) | undefined)?.documents as unknown[] | undefined)?.length),
    };
    const completed = Object.values(steps).filter(Boolean).length;
    const currentStep = onboarding?.currentStep ?? 1;
    res.json({
      success: true,
      data: {
        steps,
        progress: Math.round((completed / 4) * 100),
        isComplete: completed === 4,
        currentStep,
        onboardingStatus: onboarding?.status,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ success: false, message });
  }
});

router.put('/profile', async (req: Request, res: Response) => {
  try {
    // BE-MER-002: Explicit field whitelist — no sensitive fields allowed here.
    // Allowed: public profile/surface-level fields only.
    // Blocked: isVerified, subscription, accountLockedUntil, bankDetails,
    //          verificationStatus, kycStatus, rating, currentPlan, onboarding.*.
    const ALLOWED_FIELDS = [
      'businessName', 'ownerName', 'phone', 'address', 'category', 'logo',
      'coverImage', 'description', 'website', 'socialLinks', 'tags',
    ] as const;

    const update: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in req.body) {
        update[field] = req.body[field];
      }
    }

    // Trim whitespace on string fields
    for (const key of Object.keys(update)) {
      if (typeof update[key] === 'string') {
        update[key] = (update[key] as string).trim();
      }
    }

    // Validation
    const errors: string[] = [];

    if ('businessName' in update) {
      const v = update.businessName;
      if (typeof v !== 'string' || v.length < 3 || v.length > 200) {
        errors.push('businessName must be a string between 3 and 200 characters');
      }
    }

    if ('ownerName' in update) {
      const v = update.ownerName;
      if (typeof v !== 'string' || v.length < 2 || v.length > 100) {
        errors.push('ownerName must be a string between 2 and 100 characters');
      }
    }

    if ('phone' in update) {
      const v = update.phone;
      if (typeof v !== 'string' || !/^[6-9]\d{9}$/.test(v)) {
        errors.push('phone must be a valid 10-digit Indian mobile number');
      }
    }

    if ('description' in update) {
      const v = update.description;
      if (typeof v !== 'string' || v.length > 2000) {
        errors.push('description must be at most 2000 characters');
      }
    }

    if ('website' in update) {
      const v = update.website;
      if (typeof v === 'string' && v.length > 0 && !/^https?:\/\//.test(v)) {
        errors.push('website must start with http:// or https://');
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const merchant = await Merchant.findByIdAndUpdate(req.merchantId, { $set: update }, { new: true });
    res.json({ success: true, data: merchant });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ success: false, message });
  }
});

router.put('/documents', async (req: Request, res: Response) => {
  try {
    // Only allow non-empty array of document objects with required fields
    const documents = req.body.documents;
    if (!Array.isArray(documents)) {
      res.status(400).json({ success: false, message: 'documents must be an array' });
      return;
    }

    const validTypes = ['business_license', 'id_proof', 'address_proof', 'gst_certificate', 'pan_card'];
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (!doc || typeof doc !== 'object') {
        res.status(400).json({ success: false, message: `documents[${i}] must be an object` });
        return;
      }
      if (!doc.type || !validTypes.includes(doc.type)) {
        res.status(400).json({ success: false, message: `documents[${i}].type must be one of: ${validTypes.join(', ')}` });
        return;
      }
      if (!doc.url || typeof doc.url !== 'string') {
        res.status(400).json({ success: false, message: `documents[${i}].url must be a non-empty string` });
        return;
      }
    }

    const merchant = await Merchant.findByIdAndUpdate(
      req.merchantId,
      { $set: { 'onboarding.stepData.verification.documents': documents } },
      { new: true }
    );
    res.json({ success: true, data: merchant });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ success: false, message });
  }
});

// ── Bank Details (BE-MER-003, BE-MER-010) ────────────────────────────────
// Bank details are stored in onboarding.stepData.bankDetails.
// The Merchant model pre-save hook encrypts accountNumber and ifscCode before
// writing to MongoDB (AES-256-GCM via the shared encryption utility).
// Bank details CANNOT be submitted via /merchants/profile — that route's whitelist
// explicitly excludes bankDetails (BE-MER-003 fix).
// ───────────────────────────────────────────────────────────────────────

/** BE-MER-010: Validate IFSC code format. Indian IFSC: 4 letters + 0 + 6 alphanumeric = 11 chars. */
function isValidIFSC(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc);
}

/** BE-MER-010: Validate account number — 9 to 18 digits, no special chars. */
function isValidAccountNumber(acct: string): boolean {
  return /^\d{9,18}$/.test(acct);
}

/** BE-MER-010: Validate account holder name — min 2 chars after trim. */
function isValidHolderName(name: string): boolean {
  return typeof name === 'string' && name.trim().length >= 2;
}

router.put('/bank-details', async (req: Request, res: Response) => {
  try {
    const { accountNumber, ifscCode, accountHolderName, bankName, upiId } = req.body;

    // Required fields check
    const missing: string[] = [];
    if (!accountNumber) missing.push('accountNumber');
    if (!ifscCode) missing.push('ifscCode');
    if (!accountHolderName) missing.push('accountHolderName');
    if (!bankName) missing.push('bankName');
    if (missing.length > 0) {
      res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
      return;
    }

    // BE-MER-010: Field-level validation
    const errors: string[] = [];

    if (!isValidIFSC(ifscCode)) {
      errors.push(
        'ifscCode must be a valid 11-character IFSC code (e.g., SBIN0001234). Format: 4 letters + 0 + 6 alphanumeric characters.'
      );
    }

    if (!isValidAccountNumber(accountNumber)) {
      errors.push('accountNumber must be 9 to 18 digits with no spaces or special characters.');
    }

    if (!isValidHolderName(accountHolderName)) {
      errors.push('accountHolderName must be at least 2 characters.');
    }

    if (bankName && (typeof bankName !== 'string' || bankName.trim().length < 2)) {
      errors.push('bankName must be at least 2 characters.');
    }

    if (upiId !== undefined && upiId !== null && upiId !== '') {
      // UPI ID format: alphanumeric + @ + alphanumeric/handle (e.g., name@okicici)
      if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) {
        errors.push('upiId must be a valid UPI ID (e.g., name@okicici).');
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Bank details validation failed', errors });
      return;
    }

    // Normalise: strip spaces/dashes from accountNumber and uppercase IFSC before storage.
    // The model pre-save hook will encrypt accountNumber and ifscCode.
    const normalizedAccount = accountNumber.replace(/[\s-]/g, '');
    const normalizedIFSC = ifscCode.toUpperCase().trim();

    const bankDetails: Record<string, string> = {
      accountNumber: normalizedAccount,
      ifscCode: normalizedIFSC,
      accountHolderName: accountHolderName.trim(),
      bankName: bankName.trim(),
    };
    if (upiId && typeof upiId === 'string' && upiId.trim().length > 0) {
      bankDetails.upiId = upiId.trim().toLowerCase();
    }

    const merchant = await Merchant.findByIdAndUpdate(
      req.merchantId,
      { $set: { 'onboarding.stepData.bankDetails': bankDetails } },
      { new: true }
    );
    if (!merchant) {
      res.status(404).json({ success: false, message: 'Merchant not found' });
      return;
    }
    res.json({ success: true, message: 'Bank details saved securely', data: merchant });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ success: false, message });
  }
});

// ── Submit / Complete Onboarding (BE-MER-004) ────────────────────────────
// BE-MER-004 fix: Validate that ALL required onboarding steps are complete
// before allowing submission. Merchants cannot skip steps or submit prematurely.
// Step order: 1=profile, 2=store, 3=bank, 4=documents.
// ────────────────────────────────────────────────────────────────────────

router.post('/submit', async (req: Request, res: Response) => {
  try {
    const merchant = await Merchant.findById(req.merchantId).lean() as Record<string, unknown> | null;
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }

    const onboarding = merchant.onboarding as Record<string, unknown> | undefined;
    const bankDetails = (onboarding?.stepData as Record<string, unknown> | undefined)?.bankDetails as
      Record<string, string> | undefined;
    const documents = (
      (onboarding?.stepData as Record<string, unknown> | undefined)?.verification as
        Record<string, unknown> | undefined
    )?.documents as Array<unknown> | undefined;

    const errors: string[] = [];

    // Step 1: Profile must be complete
    if (!merchant.businessName) {
      errors.push('Step 1 incomplete: Profile (businessName) not filled in.');
    }

    // Step 2: At least one store must be created
    const storeCount = await Store.countDocuments({ merchantId: req.merchantId });
    if (storeCount === 0) {
      errors.push('Step 2 incomplete: At least one store must be created.');
    }

    // Step 3: Bank details must be submitted (both accountNumber and ifscCode must be non-empty)
    if (!bankDetails?.accountNumber || !bankDetails?.ifscCode) {
      errors.push('Step 3 incomplete: Bank details not submitted.');
    }

    // Step 4: At least one verification document must be uploaded
    if (!documents || documents.length === 0) {
      errors.push('Step 4 incomplete: At least one document must be uploaded.');
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot submit: all onboarding steps must be completed first.',
        errors,
      });
      return;
    }

    // All steps verified — mark onboarding complete
    const updated = await Merchant.findByIdAndUpdate(
      req.merchantId,
      {
        $set: {
          'onboarding.status': 'completed',
          'onboarding.completedAt': new Date(),
          verificationStatus: 'pending',
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        merchantId: updated?._id,
        submissionId: updated?._id,
        status: 'pending_review',
        submissionDate: new Date().toISOString(),
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({ success: false, message });
  }
});

export default router;
