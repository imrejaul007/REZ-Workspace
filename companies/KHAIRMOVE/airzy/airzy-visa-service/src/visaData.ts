/**
 * Visa Requirements Database
 * Visa requirements for Indians traveling to popular destinations
 */

import { VisaRequirement, Country } from './types';

// Visa-free countries for Indian passport holders (as of 2026)
const VISA_FREE_COUNTRIES = [
  'BT', // Bhutan
  'NP', // Nepal
  'MV', // Maldives
  'TT', // Trinidad and Tobago
  'VG', // Vanuatu
  'GE', // Georgia
];

// Visa on Arrival for Indians
const VISA_ON_ARRIVAL: Record<string, { maxStay: string; cost: string }> = {
  'TH': { maxStay: '15 days', cost: 'Free' },
  'ID': { maxStay: '30 days', cost: 'Free' },
  'LK': { maxStay: '30 days', cost: 'Free' },
  'MY': { maxStay: '15 days', cost: 'Free' },
  'MV': { maxStay: '30 days', cost: 'Free' },
  'AO': { maxStay: '30 days', cost: 'Free' },
  'TJ': { maxStay: '45 days', cost: 'Free' },
  'BN': { maxStay: '14 days', cost: 'Free' },
  'LA': { maxStay: '30 days', cost: 'Free' },
};

// ETA/eVisa required
const ETA_COUNTRIES: Record<string, { cost: string; validity: string; maxStay: string }> = {
  'AU': { cost: 'AUD 20', validity: '1 year', maxStay: '90 days' },
  'NZ': { cost: 'NZD 35', validity: '1 year', maxStay: '90 days' },
  'LK': { cost: 'Free', validity: '30 days', maxStay: '30 days' },
  'TO': { cost: 'Free', validity: '180 days', maxStay: '30 days' },
};

// Popular destinations with visa requirements
export const VISA_DATABASE: Record<string, VisaRequirement> = {
  'TH': {
    destinationCountry: 'TH',
    originCountry: 'IN',
    visaType: 'tourist',
    requirement: {
      visaRequired: false,
      visaOnArrival: true,
      etaRequired: false,
      visaFree: false,
    },
    processingTime: 'On arrival',
    processingTimeDays: 0,
    cost: { amount: 0, currency: 'INR' },
    maxStay: '15 days',
    validity: '15 days',
    documents: [
      { name: 'Valid passport', required: true, description: '6+ months validity' },
      { name: 'Return ticket', required: true, description: 'Confirmed return/ongoing' },
      { name: 'Hotel booking', required: true, description: 'Or invitation letter' },
      { name: 'Sufficient funds', required: true, description: 'THB 20,000 cash' },
    ],
    eligibility: [
      'Indian passport holder',
      'Passport valid for 6+ months',
      'No criminal record',
      'Not on blacklisted list',
    ],
    restrictions: [
      'Cannot work',
      'Cannot study',
      'Cannot extend stay',
    ],
  },
  'AE-DXB': {
    destinationCountry: 'AE',
    originCountry: 'IN',
    visaType: 'tourist',
    requirement: {
      visaRequired: true,
      visaOnArrival: false,
      etaRequired: true,
      visaFree: false,
    },
    processingTime: '24-48 hours',
    processingTimeDays: 2,
    cost: { amount: 34500, currency: 'INR' },
    maxStay: '14 days',
    validity: '60 days',
    documents: [
      { name: 'Passport', required: true, description: '6+ months validity, 2 blank pages' },
      { name: 'Photo', required: true, description: 'White background, 4.5x3.5cm' },
      { name: 'Return ticket', required: true, description: 'Confirmed return ticket' },
      { name: 'Hotel booking', required: true, description: 'Confirmed hotel reservation' },
      { name: 'Bank statement', required: true, description: 'Last 6 months, min balance AED 2000' },
    ],
    eligibility: [
      'Indian passport holder',
      'Return ticket booked',
      'Hotel confirmed',
      'Sufficient funds',
    ],
    restrictions: [
      'Cannot work',
      'Cannot study',
    ],
    applicationUrl: 'https://www.vfsglobal.com/emirates/visa-india/',
  },
  'SG': {
    destinationCountry: 'SG',
    originCountry: 'IN',
    visaType: 'tourist',
    requirement: {
      visaRequired: true,
      visaOnArrival: false,
      etaRequired: true,
      visaFree: false,
    },
    processingTime: '1-3 working days',
    processingTimeDays: 3,
    cost: { amount: 2500, currency: 'INR' },
    maxStay: '30 days',
    validity: '62 days',
    documents: [
      { name: 'Passport', required: true, description: '6+ months validity' },
      { name: 'Visa application', required: true, description: 'Form 14A' },
      { name: 'Photo', required: true, description: 'White background' },
      { name: 'Return ticket', required: true, description: 'Confirmed return ticket' },
      { name: 'Itinerary', required: true, description: 'Day-by-day plan' },
      { name: 'Financial proof', required: true, description: 'Bank statements, tax returns' },
      { name: 'Sponsor letter', required: false, description: 'If visiting family/friends' },
    ],
    eligibility: [
      'Indian passport holder',
      'Valid return ticket',
      'Accommodation confirmed',
      'Sufficient funds',
    ],
    restrictions: [
      'Cannot work',
      'Cannot extend without reason',
    ],
  },
  'MY': {
    destinationCountry: 'MY',
    originCountry: 'IN',
    visaType: 'tourist',
    requirement: {
      visaRequired: false,
      visaOnArrival: true,
      etaRequired: false,
      visaFree: false,
    },
    processingTime: 'On arrival',
    processingTimeDays: 0,
    cost: { amount: 0, currency: 'INR' },
    maxStay: '15 days',
    validity: '15 days',
    documents: [
      { name: 'Valid passport', required: true, description: '6+ months validity' },
      { name: 'Return ticket', required: true, description: 'Confirmed return/ongoing' },
      { name: 'Hotel booking', required: true, description: 'Confirmed booking' },
      { name: 'Sufficient funds', required: true, description: 'MYR 1000 or credit card' },
    ],
    eligibility: [
      'Indian passport holder',
      'Passport valid for 6+ months',
      'Confirmed return ticket',
    ],
    restrictions: [
      'Cannot work',
      'Cannot study',
      'Cannot extend',
    ],
  },
  'JP': {
    destinationCountry: 'JP',
    originCountry: 'IN',
    visaType: 'tourist',
    requirement: {
      visaRequired: true,
      visaOnArrival: false,
      etaRequired: false,
      visaFree: false,
    },
    processingTime: '4-5 working days',
    processingTimeDays: 5,
    cost: { amount: 1500, currency: 'INR' },
    maxStay: '15 days',
    validity: '90 days',
    documents: [
      { name: 'Valid passport', required: true, description: '6+ months validity' },
      { name: 'Visa application', required: true, description: 'Form 1C' },
      { name: 'Photo', required: true, description: '45x45mm, white background' },
      { name: 'Itinerary', required: true, description: 'Day-by-day plan' },
      { name: 'Bank statement', required: true, description: 'Last 3 months' },
      { name: 'Flight booking', required: true, description: 'Confirmed booking' },
      { name: 'Hotel booking', required: true, description: 'Confirmed reservation' },
      { name: 'Employment letter', required: true, description: 'For employed applicants' },
    ],
    eligibility: [
      'Genuine tourist purpose',
      'Sufficient funds',
      'Valid documents',
      'No immigration violations',
    ],
    restrictions: [
      'Cannot work',
      'Cannot engage in paid activities',
    ],
  },
  'AU': {
    destinationCountry: 'AU',
    originCountry: 'IN',
    visaType: 'tourist',
    requirement: {
      visaRequired: true,
      visaOnArrival: false,
      etaRequired: true,
      visaFree: false,
    },
    processingTime: '21-29 days',
    processingTimeDays: 25,
    cost: { amount: 1500, currency: 'AUD' },
    maxStay: '90 days',
    validity: '1 year',
    documents: [
      { name: 'Valid passport', required: true, description: '6+ months validity' },
      { name: 'ETA application', required: true, description: 'Through Australian ETA app' },
      { name: 'Photo', required: true, description: 'Digital, specific requirements' },
      { name: 'Health insurance', required: true, description: 'Recommended' },
      { name: 'Financial proof', required: true, description: 'Bank statements' },
      { name: 'Character requirements', required: true, description: 'Police clearance' },
    ],
    eligibility: [
      'Genuine visitor',
      'Sufficient funds',
      'Health insurance',
      'Good character',
    ],
    restrictions: [
      'Cannot work',
      'Cannot study',
      'Cannot stay beyond 90 days',
    ],
    applicationUrl: 'https://www.homeaffairs.gov.au/eta',
  },
  'US': {
    destinationCountry: 'US',
    originCountry: 'IN',
    visaType: 'tourist',
    requirement: {
      visaRequired: true,
      visaOnArrival: false,
      etaRequired: false,
      visaFree: false,
    },
    processingTime: '3-5 weeks (varies)',
    processingTimeDays: 35,
    cost: { amount: 18500, currency: 'INR' },
    maxStay: '90 days',
    validity: '10 years',
    documents: [
      { name: 'Valid passport', required: true, description: '6+ months validity' },
      { name: 'DS-160 confirmation', required: true, description: 'Online application' },
      { name: 'Photo', required: true, description: 'Digital upload requirements' },
      { name: 'Appointment confirmation', required: true, description: 'Visa appointment' },
      { name: 'Financial proof', required: true, description: 'Bank statements, ITR' },
      { name: 'Employment letter', required: true, description: 'From employer' },
      { name: 'Ties to India', required: true, description: 'Property, family, job' },
    ],
    eligibility: [
      'Non-immigrant intent',
      'Strong ties to India',
      'Sufficient funds',
      'Valid purpose of travel',
    ],
    restrictions: [
      'Cannot work',
      'Cannot study',
      'Interview required',
    ],
    applicationUrl: 'https://www.ustraveldocs.com/in/',
  },
  'GB': {
    destinationCountry: 'GB',
    originCountry: 'IN',
    visaType: 'tourist',
    requirement: {
      visaRequired: true,
      visaOnArrival: false,
      etaRequired: false,
      visaFree: false,
    },
    processingTime: '3 weeks',
    processingTimeDays: 21,
    cost: { amount: 10000, currency: 'GBP' },
    maxStay: '180 days',
    validity: '180 days',
    documents: [
      { name: 'Valid passport', required: true, description: '6+ months validity' },
      { name: 'Application form', required: true, description: 'Online form' },
      { name: 'Photo', required: true, description: '45x35mm' },
      { name: 'Bank statements', required: true, description: 'Last 6 months' },
      { name: 'Employment letter', required: true, description: 'Approved leave' },
      { name: 'Travel itinerary', required: true, description: 'Day-by-day plan' },
      { name: 'Accommodation', required: true, description: 'Hotel bookings' },
    ],
    eligibility: [
      'Genuine visitor',
      'Sufficient funds',
      'Will leave before visa expires',
      'No immigration breach',
    ],
    restrictions: [
      'Cannot work',
      'Cannot use NHS',
      'Cannot marry/register civil partnership',
    ],
    applicationUrl: 'https://www.vfsglobal.com/uk/visa-india/',
  },
};

/**
 * Get visa requirement
 */
export function getVisaRequirement(destination: string, purpose: string = 'tourist'): VisaRequirement | undefined {
  return VISA_DATABASE[destination];
}

/**
 * Check if visa-free
 */
export function isVisaFree(countryCode: string): boolean {
  return VISA_FREE_COUNTRIES.includes(countryCode);
}

/**
 * Check if visa on arrival available
 */
export function isVisaOnArrival(countryCode: string): { available: boolean; details?: typeof VISA_ON_ARRIVAL[string] } {
  if (VISA_ON_ARRIVAL[countryCode]) {
    return { available: true, details: VISA_ON_ARRIVAL[countryCode] };
  }
  return { available: false };
}

/**
 * Check if ETA required
 */
export function isETARequired(countryCode: string): { required: boolean; details?: typeof ETA_COUNTRIES[string] } {
  if (ETA_COUNTRIES[countryCode]) {
    return { required: true, details: ETA_COUNTRIES[countryCode] };
  }
  return { required: false };
}

/**
 * Get all visa requirements for a destination
 */
export function getAllRequirements(destination: string): VisaRequirement[] {
  const purposes: VisaRequirement['visaType'][] = ['tourist', 'business', 'student', 'work', 'transit'];
  const requirements: VisaRequirement[] = [];

  for (const purpose of purposes) {
    const req = VISA_DATABASE[destination];
    if (req) {
      requirements.push({ ...req, visaType: purpose });
    }
  }

  return requirements;
}

/**
 * Calculate visa readiness score
 */
export function calculateReadiness(
  passportExpiry: string,
  documents: string[],
  travelDate: string
): { score: number; level: string; checks: Record<string, boolean> } {
  let score = 0;
  const checks: Record<string, boolean> = {
    passportValid: false,
    passportExpiryOk: false,
    documentsComplete: false,
    sufficientTime: false,
  };

  // Check passport validity (simplified)
  const expiryDate = new Date(passportExpiry);
  const now = new Date();
  const travelDateObj = new Date(travelDate);

  if (expiryDate > now) {
    checks.passportValid = true;
    score += 25;
  }

  // Check passport expiry (6+ months)
  const sixMonthsLater = new Date(now);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  if (expiryDate > sixMonthsLater) {
    checks.passportExpiryOk = true;
    score += 25;
  }

  // Check documents (assume complete if we have any)
  if (documents.length > 0) {
    checks.documentsComplete = true;
    score += 25;
  }

  // Check time before travel
  const daysUntilTravel = Math.floor((travelDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilTravel >= 30) {
    checks.sufficientTime = true;
    score += 25;
  } else if (daysUntilTravel >= 14) {
    score += 15; // Partial credit
  }

  let level = 'not-ready';
  if (score >= 75) level = 'ready';
  else if (score >= 50) level = 'almost-ready';
  else if (score >= 25) level = 'needs-work';

  return { score, level, checks };
}
