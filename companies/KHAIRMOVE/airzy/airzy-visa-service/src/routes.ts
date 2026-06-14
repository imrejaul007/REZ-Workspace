/**
 * Visa Service Routes
 * API endpoints for visa requirements and assistance
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getVisaRequirement,
  isVisaFree,
  isVisaOnArrival,
  isETARequired,
  calculateReadiness,
  VISA_DATABASE
} from './visaData';
import { POPULAR_DESTINATIONS } from './types';

const router = Router();

// In-memory store for applications (would be database in production)
const applications = new Map();

/**
 * Health check
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'airzy-visa-service' });
});

/**
 * Get popular destinations
 */
router.get('/destinations', (_req: Request, res: Response) => {
  res.json({ destinations: POPULAR_DESTINATIONS });
});

/**
 * Check visa requirement
 */
router.get('/check/:destination', (req: Request, res: Response) => {
  const { destination } = req.params;
  const purpose = (req.query.purpose as string) || 'tourist';

  // Check if visa-free
  if (isVisaFree(destination.toUpperCase())) {
    return res.json({
      visaFree: true,
      message: 'Indian passport holders can visit this country without a visa!',
      destination: destination.toUpperCase(),
    });
  }

  // Check visa on arrival
  const voa = isVisaOnArrival(destination.toUpperCase());
  if (voa.available) {
    return res.json({
      visaOnArrival: true,
      maxStay: voa.details?.maxStay,
      cost: voa.details?.cost,
      message: 'Visa available on arrival',
      destination: destination.toUpperCase(),
    });
  }

  // Check ETA
  const eta = isETARequired(destination.toUpperCase());
  if (eta.required) {
    return res.json({
      etaRequired: true,
      cost: eta.details?.cost,
      validity: eta.details?.validity,
      maxStay: eta.details?.maxStay,
      message: 'Electronic Travel Authorization required',
      destination: destination.toUpperCase(),
    });
  }

  // Check database
  const requirement = getVisaRequirement(destination.toUpperCase(), purpose);
  if (requirement) {
    return res.json({ requirement });
  }

  res.status(404).json({
    error: 'Visa information not available',
    destination: destination.toUpperCase(),
    suggestion: 'Contact us for assistance with this destination',
  });
});

/**
 * Get visa readiness score
 */
router.post('/readiness', (req: Request, res: Response) => {
  const { passportExpiry, documents, travelDate } = req.body;

  if (!passportExpiry) {
    return res.status(400).json({ error: 'passportExpiry is required' });
  }

  const readiness = calculateReadiness(
    passportExpiry,
    documents || [],
    travelDate || new Date().toISOString()
  );

  res.json({
    readiness,
    recommendations: generateRecommendations(readiness),
  });
});

/**
 * Get all visa requirements for a destination
 */
router.get('/destinations/:destination/all', (req: Request, res: Response) => {
  const { destination } = req.params;
  const reqs = VISA_DATABASE[destination.toUpperCase()];

  if (!reqs) {
    return res.status(404).json({ error: 'Destination not found' });
  }

  res.json({
    destination: destination.toUpperCase(),
    requirements: [
      { type: 'tourist', ...reqs },
    ],
  });
});

/**
 * Get application by ID
 */
router.get('/applications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const app = applications.get(id);

  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  res.json({ application: app });
});

/**
 * Create new visa application
 */
router.post('/applications', (req: Request, res: Response) => {
  const {
    userId,
    destinationCountry,
    visaType,
    passport,
  } = req.body;

  if (!userId || !destinationCountry || !visaType || !passport) {
    return res.status(400).json({
      error: 'Missing required fields: userId, destinationCountry, visaType, passport',
    });
  }

  const id = uuidv4();
  const application = {
    id,
    userId,
    destinationCountry: destinationCountry.toUpperCase(),
    visaType,
    status: 'draft',
    passport,
    documents: [],
    createdAt: new Date().toISOString(),
  };

  applications.set(id, application);

  res.status(201).json({ application });
});

/**
 * Update application documents
 */
router.patch('/applications/:id/documents', (req: Request, res: Response) => {
  const { id } = req.params;
  const { documents } = req.body;

  const app = applications.get(id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  app.documents = documents;
  app.updatedAt = new Date().toISOString();

  res.json({ application: app });
});

/**
 * Submit application
 */
router.post('/applications/:id/submit', (req: Request, res: Response) => {
  const { id } = req.params;

  const app = applications.get(id);
  if (!app) {
    return res.status(404).json({ error: 'Application not found' });
  }

  app.status = 'submitted';
  app.submittedAt = new Date().toISOString();

  res.json({
    application: app,
    message: 'Application submitted successfully',
  });
});

/**
 * AI Visa Assistant
 */
router.post('/assistant', (req: Request, res: Response) => {
  const { message, context } = req.body;

  // Simple intent detection
  const lowerMsg = message.toLowerCase();

  let intent = 'general';
  let response = '';
  let suggestions: string[] = [];

  if (lowerMsg.includes('visa') && (lowerMsg.includes('need') || lowerMsg.includes('require') || lowerMsg.includes('check'))) {
    intent = 'check_requirement';
    if (context?.destination) {
      const visa = getVisaRequirement(context.destination.toUpperCase());
      if (visa) {
        response = `For ${context.destination}, Indian citizens need ${visa.requirement.visaRequired ? 'a visa' : visa.requirement.visaOnArrival ? 'visa on arrival' : 'no visa'}. Processing time is ${visa.processingTime}.`;
        suggestions = ['What documents do I need?', 'How much does it cost?', 'How long can I stay?'];
      }
    } else {
      response = 'I can help you check visa requirements. Which country are you planning to visit?';
      suggestions = ['Check visa for Thailand', 'Check visa for UAE', 'Check visa for Japan'];
    }
  } else if (lowerMsg.includes('document')) {
    intent = 'check_document';
    response = 'Most visa applications require: valid passport (6+ months), photos, bank statements, travel itinerary, and accommodation proof. Would you like me to check specific document requirements for a destination?';
    suggestions = ['Documents for Thailand', 'Documents for UAE', 'Documents for US'];
  } else if (lowerMsg.includes('how long') || lowerMsg.includes('stay')) {
    intent = 'check_eligibility';
    response = 'The maximum stay depends on the destination country and visa type. Tourist visas typically allow 15-90 days. Would you like me to check a specific country?';
    suggestions = ['Thailand max stay', 'UAE max stay', 'US max stay'];
  } else {
    response = 'I can help with visa requirements, document checklists, processing times, and application assistance. What would you like to know?';
    suggestions = [
      'Do I need a visa for Thailand?',
      'What documents for UAE visa?',
      'How long does US visa take?',
    ];
  }

  res.json({ intent, response, suggestions });
});

/**
 * Helper to generate recommendations based on readiness
 */
function generateRecommendations(readiness: { score: number; level: string; checks: Record<string, boolean> }): string[] {
  const recs: string[] = [];

  if (!readiness.checks.passportValid) {
    recs.push('Your passport may have expired. Please renew before travel.');
  }

  if (!readiness.checks.passportExpiryOk) {
    recs.push('Your passport needs to be valid for at least 6 months from your travel date.');
  }

  if (!readiness.checks.documentsComplete) {
    recs.push('Start gathering your travel documents early.');
  }

  if (!readiness.checks.sufficientTime) {
    recs.push('Apply for your visa at least 30 days before travel.');
  }

  if (readiness.score >= 75) {
    recs.push('Great! You are well-prepared for your visa application.');
  }

  return recs;
}

export default router;
