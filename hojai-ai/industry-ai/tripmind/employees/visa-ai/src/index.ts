/**
 * Visa AI - Visa Application Assistant
 * Part of TRIPMIND - Travel Agency AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface VisaApplication {
  id: string;
  applicationRef: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  destinationCountry: string;
  visaType: 'tourist' | 'business' | 'student' | 'work' | 'transit';
  passportNumber: string;
  passportExpiry: string;
  processingTime: string;
  fee: number;
  status: 'draft' | 'pending_docs' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  documents: { name: string; status: 'pending' | 'uploaded' | 'verified' | 'rejected' }[];
  appointmentDate?: string;
  visaValidity?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisaRequirement {
  country: string;
  visaType: string;
  processingDays: number;
  fee: number;
  documents: string[];
  eligibility: string[];
  restrictions: string[];
}

export class VisaAI {
  private visaRequirements: Map<string, VisaRequirement[]> = new Map();

  constructor() {
    this.initializeRequirements();
  }

  private initializeRequirements(): void {
    // Dubai Tourist Visa
    this.visaRequirements.set('dubai', [
      {
        country: 'UAE',
        visaType: 'tourist',
        processingDays: 3,
        fee: 11500,
        documents: ['Valid passport (6+ months)', 'Passport photos', 'Flight itinerary', 'Hotel booking', 'Bank statement'],
        eligibility: ['Valid passport', 'Sufficient funds', 'Return ticket'],
        restrictions: ['Cannot work', 'Cannot study', 'Max 90 days stay']
      },
      {
        country: 'UAE',
        visaType: 'business',
        processingDays: 5,
        fee: 18000,
        documents: ['Valid passport', 'Invitation letter', 'Company letter', 'Bank statement', 'Passport photos'],
        eligibility: ['Business purpose', 'Sponsor in UAE'],
        restrictions: ['Business activities only']
      }
    ]);

    // Thailand Visa
    this.visaRequirements.set('thailand', [
      {
        country: 'Thailand',
        visaType: 'tourist',
        processingDays: 3,
        fee: 2500,
        documents: ['Valid passport (6+ months)', 'Passport photos', 'Flight itinerary', 'Hotel booking', 'Financial proof'],
        eligibility: ['Tourist purpose', 'Clean immigration record'],
        restrictions: ['Max 60 days', 'No work permitted']
      }
    ]);

    // Singapore Visa
    this.visaRequirements.set('singapore', [
      {
        country: 'Singapore',
        visaType: 'tourist',
        processingDays: 2,
        fee: 3000,
        documents: ['Valid passport', 'Passport photos', 'Form 14A', 'Itinerary', 'Proof of accommodation'],
        eligibility: ['Tourist/visit purpose', 'Valid onward ticket'],
        restrictions: ['Max 30 days', 'No employment']
      }
    ]);
  }

  async getRequirements(country: string, visaType: string): Promise<VisaRequirement | null> {
    const requirements = this.visaRequirements.get(country.toLowerCase());
    if (!requirements) return null;
    return requirements.find(r => r.visaType === visaType) || null;
  }

  async createApplication(data: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    destinationCountry: string;
    visaType: 'tourist' | 'business' | 'student' | 'work' | 'transit';
    passportNumber: string;
    passportExpiry: string;
  }): Promise<VisaApplication> {
    const requirement = await this.getRequirements(data.destinationCountry, data.visaType);
    const fee = requirement?.fee || 5000;
    const processingDays = requirement?.processingDays || 7;

    const application: VisaApplication = {
      id: uuidv4(),
      applicationRef: `VISA${Date.now().toString(36).toUpperCase()}`,
      ...data,
      processingTime: `${processingDays} working days`,
      fee,
      status: 'draft',
      documents: (requirement?.documents || [
        'Valid passport',
        'Passport photos',
        'Application form',
        'Financial documents'
      ]).map(doc => ({ name: doc, status: 'pending' as const })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return application;
  }

  async checkEligibility(
    country: string,
    visaType: string,
    applicantData: {
      passportExpiry: string;
      hasFunds: boolean;
      hasTravelHistory: boolean;
    }
  ): Promise<{ eligible: boolean; reasons: string[] }> {
    const requirement = await this.getRequirements(country, visaType);
    const reasons: string[] = [];

    if (!requirement) {
      return { eligible: false, reasons: ['Visa type not available for this country'] };
    }

    // Check passport validity
    const expiryDate = new Date(applicantData.passportExpiry);
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    if (expiryDate < sixMonthsLater) {
      reasons.push('Passport must be valid for at least 6 months from travel date');
    }

    // Check funds
    if (!applicantData.hasFunds) {
      reasons.push('Insufficient financial proof');
    }

    const eligible = reasons.length === 0;
    return { eligible, reasons };
  }

  async uploadDocument(
    application: VisaApplication,
    documentName: string
  ): Promise<VisaApplication> {
    const docIndex = application.documents.findIndex(
      d => d.name.toLowerCase() === documentName.toLowerCase()
    );

    if (docIndex >= 0) {
      application.documents[docIndex].status = 'uploaded';
    }

    application.updatedAt = new Date().toISOString();

    // Check if all docs uploaded
    const allUploaded = application.documents.every(d => d.status !== 'pending');
    if (allUploaded) {
      application.status = 'submitted';
    } else {
      application.status = 'pending_docs';
    }

    return application;
  }

  async submitApplication(application: VisaApplication): Promise<VisaApplication> {
    const allUploaded = application.documents.every(d => d.status === 'uploaded' || d.status === 'verified');

    if (!allUploaded) {
      throw new Error('All documents must be uploaded before submission');
    }

    application.status = 'submitted';
    application.updatedAt = new Date().toISOString();

    return application;
  }

  async trackApplication(applicationRef: string): Promise<{
    status: string;
    lastUpdate: string;
    estimatedCompletion?: string;
    message?: string;
  }> {
    return {
      status: 'under_review',
      lastUpdate: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'Your application is currently under review at the embassy.'
    };
  }

  async getRequiredDocuments(country: string, visaType: string): Promise<string[]> {
    const requirement = await this.getRequirements(country, visaType);
    return requirement?.documents || ['Valid passport', 'Passport photos', 'Application form'];
  }

  async calculateFee(country: string, visaType: string, urgency?: 'normal' | 'urgent' | 'express'): Promise<{
    baseFee: number;
    serviceFee: number;
    taxes: number;
    total: number;
    urgencyMultiplier: number;
  }> {
    const requirement = await this.getRequirements(country, visaType);
    const baseFee = requirement?.fee || 5000;

    const multipliers = { normal: 1, urgent: 1.5, express: 2 };
    const multiplier = multipliers[urgency || 'normal'];

    const serviceFee = baseFee * 0.15;
    const taxes = baseFee * 0.18;
    const total = (baseFee + serviceFee) * multiplier + taxes;

    return {
      baseFee,
      serviceFee: Math.round(serviceFee),
      taxes: Math.round(taxes),
      total: Math.round(total),
      urgencyMultiplier: multiplier
    };
  }
}

export default VisaAI;
