const logger = require('../utils/logger');
const { Destination } = require('../models');

class VisaAgent {
  constructor() {
    this.name = 'Visa Agent';
    this.version = '1.0.0';
    this.enabled = process.env.AI_VISA_AGENT_ENABLED === 'true';

    // Common visa requirements database
    this.visaRequirements = {
      'United States': {
        visaRequired: true,
        visaTypes: ['B1/B2 Tourist Visa', 'ESTA (for visa waiver)'],
        processingTime: '3-5 business days (ESTA: instant)',
        cost: { esta: 21, visa: 160 },
        validity: 'ESTA: 2 years, Visa: 10 years',
        requirements: ['Valid passport', 'DS-160 form', 'Photo', 'Interview']
      },
      'United Kingdom': {
        visaRequired: true,
        visaTypes: ['Standard Visitor Visa', 'Transit Visa'],
        processingTime: '3 weeks',
        cost: { standard: 95, transit: 64 },
        validity: '6 months',
        requirements: ['Valid passport', 'Application form', 'Financial proof', 'Travel itinerary']
      },
      'Japan': {
        visaRequired: true,
        visaTypes: ['Tourist Visa', 'Transit Visa'],
        processingTime: '5-10 business days',
        cost: { tourist: 25, transit: 0 },
        validity: '90 days',
        requirements: ['Valid passport', 'Application form', 'Photo', 'Itinerary', 'Bank statement']
      },
      'Thailand': {
        visaRequired: false,
        visaTypes: ['Visa on Arrival', 'Tourist Visa (pre-arranged)'],
        processingTime: 'Visa on Arrival: 30 mins',
        cost: { voa: 2000, tourist: 1000 },
        validity: 'Visa on Arrival: 15 days, Tourist: 60 days',
        requirements: ['Valid passport (6+ months)', 'Return ticket', 'Proof of accommodation']
      },
      'France': {
        visaRequired: true,
        visaTypes: ['Schengen Tourist Visa', 'Transit Visa'],
        processingTime: '15-30 days',
        cost: { tourist: 80, transit: 60 },
        validity: '90 days (Schengen area)',
        requirements: ['Valid passport', 'Application form', 'Photo', 'Travel insurance', 'Bank statements']
      },
      'Australia': {
        visaRequired: true,
        visaTypes: ['ETA (Subclass 601)', 'Tourist Visa (Subclass 600)'],
        processingTime: 'ETA: instant to 12 hours, Visa: 20-30 days',
        cost: { eta: 20, tourist: 145 },
        validity: 'ETA: 12 months, Visa: 3-12 months',
        requirements: ['Valid passport', 'ETA app or application form', 'Health insurance']
      },
      'Germany': {
        visaRequired: true,
        visaTypes: ['Schengen Tourist Visa'],
        processingTime: '15-30 days',
        cost: { tourist: 80 },
        validity: '90 days (Schengen area)',
        requirements: ['Valid passport', 'Application form', 'Photo', 'Travel insurance', 'Itinerary']
      },
      'Singapore': {
        visaRequired: false,
        visaTypes: ['Visa Free Entry', 'Tourist Visa (for some nationalities)'],
        processingTime: 'N/A (visa free)',
        cost: { free: 0 },
        validity: '30-90 days depending on nationality',
        requirements: ['Valid passport (6+ months)', 'Return ticket', 'Sufficient funds']
      },
      'Dubai': {
        visaRequired: true,
        visaTypes: ['Tourist Visa', 'Transit Visa', '96-hour Visa'],
        processingTime: '2-4 business days',
        cost: { tourist: 120, transit: 50, ninetySix: 100 },
        validity: '30-90 days',
        requirements: ['Valid passport', 'Photo', 'Travel insurance', 'Hotel booking', 'Bank statement']
      }
    };

    this.nationalitiesWithoutVisa = {
      'United States': ['UK', 'Canada', 'Australia', 'EU countries', 'Japan', 'Singapore'],
      'United Kingdom': ['EU countries', 'US', 'Canada', 'Australia', 'New Zealand'],
      'Canada': ['US', 'UK', 'EU countries', 'Australia', 'Japan'],
      'EU': ['US', 'Canada', 'UK', 'Australia', 'New Zealand', 'Switzerland', 'Norway']
    };
  }

  async getStatus() {
    return {
      name: this.name,
      version: this.version,
      status: this.enabled ? 'active' : 'disabled',
      capabilities: [
        'visa_requirement_check',
        'document_preparation',
        'application_guidance',
        'status_tracking',
        'embassy_information'
      ],
      supportedCountries: Object.keys(this.visaRequirements).length
    };
  }

  async checkVisa(customerId, checkData) {
    try {
      logger.info(`VisaAgent: Checking visa requirements for customer ${customerId}`, { checkData });

      const {
        nationality,
        destination,
        travelDate,
        duration,
        purpose = 'tourism'
      } = checkData;

      // Find destination info
      const dest = await Destination.findOne({
        $or: [
          { name: { $regex: new RegExp(destination, 'i') } },
          { country: { $regex: new RegExp(destination, 'i') } }
        ],
        isActive: true
      });

      const destinationName = dest?.name || destination;
      const destinationCountry = dest?.country || destination;

      // Check visa requirements
      const visaInfo = this.getVisaInfo(nationality, destinationCountry);

      const result = {
        success: true,
        customerId,
        travelInfo: {
          nationality,
          destination: destinationName,
          country: destinationCountry,
          travelDate,
          duration,
          purpose
        },
        visaRequirement: {
          required: visaInfo.visaRequired,
          visaType: visaInfo.visaTypes?.[0] || 'N/A',
          processingTime: visaInfo.processingTime,
          estimatedCost: visaInfo.cost,
          validity: visaInfo.validity,
          requirements: visaInfo.requirements || []
        },
        timeline: this.generateTimeline(visaInfo, travelDate, purpose),
        documents: this.generateDocumentList(visaInfo, purpose),
        tips: this.generateTips(visaInfo, destinationCountry),
        embassyInfo: this.getEmbassyInfo(destinationCountry),
        warnings: this.generateWarnings(nationality, destinationCountry, duration)
      };

      return result;
    } catch (error) {
      logger.error('VisaAgent: Error checking visa', { error: error.message });
      throw error;
    }
  }

  getVisaInfo(nationality, destination) {
    // Check if nationality can visit destination without visa
    const visaFree = this.nationalitiesWithoutVisa[nationality]?.some(
      c => destination.toLowerCase().includes(c.toLowerCase())
    );

    if (visaFree) {
      return {
        visaRequired: false,
        visaTypes: ['Visa Free Entry'],
        processingTime: 'N/A',
        cost: { free: 0 },
        validity: 'Varies by nationality',
        requirements: ['Valid passport', 'Return ticket', 'Proof of accommodation', 'Sufficient funds']
      };
    }

    // Check database
    const dbInfo = this.visaRequirements[destination];
    if (dbInfo) {
      return dbInfo;
    }

    // Default response
    return {
      visaRequired: true,
      visaTypes: ['Tourist Visa'],
      processingTime: '2-4 weeks',
      cost: { standard: 100 },
      validity: '30-90 days',
      requirements: ['Valid passport', 'Application form', 'Photo', 'Travel itinerary', 'Bank statements', 'Travel insurance']
    };
  }

  generateTimeline(visaInfo, travelDate, purpose) {
    const timeline = [];
    const travel = new Date(travelDate);
    const now = new Date();

    if (!visaInfo.visaRequired) {
      timeline.push({
        step: 1,
        action: 'Book flights and accommodation',
        timing: 'As soon as possible',
        status: travel.getTime() - now.getTime() > 7 * 24 * 60 * 60 * 1000 ? 'upcoming' : 'pending'
      });
      timeline.push({
        step: 2,
        action: 'Prepare travel documents',
        timing: '1-2 weeks before travel',
        status: 'pending'
      });
      timeline.push({
        step: 3,
        action: 'Travel - no visa needed',
        timing: 'On arrival',
        status: 'pending'
      });
    } else {
      const processingDays = visaInfo.processingTime.includes('instant') ? 1 :
        visaInfo.processingTime.includes('week') ? 14 : 5;

      const applyByDate = new Date(travel.getTime() - (processingDays + 7) * 24 * 60 * 60 * 1000);

      timeline.push({
        step: 1,
        action: 'Gather required documents',
        timing: '4-6 weeks before travel',
        status: now > new Date(applyByDate.getTime() - 14 * 24 * 60 * 60 * 1000) ? 'overdue' : 'upcoming'
      });
      timeline.push({
        step: 2,
        action: 'Complete application form',
        timing: '3-4 weeks before travel',
        status: 'upcoming'
      });
      timeline.push({
        step: 3,
        action: 'Pay visa fee',
        timing: 'When submitting application',
        status: 'pending'
      });
      timeline.push({
        step: 4,
        action: 'Schedule appointment (if required)',
        timing: '3 weeks before travel',
        status: 'pending'
      });
      timeline.push({
        step: 5,
        action: 'Submit application',
        timing: `By ${applyByDate.toISOString().split('T')[0]}`,
        status: now > applyByDate ? 'urgent' : 'pending'
      });
      timeline.push({
        step: 6,
        action: 'Wait for processing',
        timing: visaInfo.processingTime,
        status: 'pending'
      });
      timeline.push({
        step: 7,
        action: 'Collect passport and travel',
        timing: '1 week before travel',
        status: 'pending'
      });
    }

    return timeline;
  }

  generateDocumentList(visaInfo, purpose) {
    const documents = [];

    if (!visaInfo.visaRequired) {
      documents.push({ name: 'Valid passport', mandatory: true, notes: 'At least 6 months validity' });
      documents.push({ name: 'Return ticket', mandatory: true, notes: 'Proof of onward travel' });
      documents.push({ name: 'Proof of accommodation', mandatory: true, notes: 'Hotel booking or invitation letter' });
      documents.push({ name: 'Travel insurance', mandatory: false, notes: 'Recommended but not required' });
    } else {
      documents.push({ name: 'Valid passport', mandatory: true, notes: 'At least 6 months validity, 2 blank pages' });
      documents.push({ name: 'Visa application form', mandatory: true, notes: 'Completed and signed' });
      documents.push({ name: 'Passport photos', mandatory: true, notes: '2 recent photos (often specific requirements)' });
      documents.push({ name: 'Proof of travel', mandatory: true, notes: 'Flight itinerary, hotel bookings' });
      documents.push({ name: 'Financial documents', mandatory: true, notes: 'Bank statements (last 3-6 months)' });
      documents.push({ name: 'Travel insurance', mandatory: false, notes: 'May be required for some visas' });
      documents.push({ name: 'Employment verification', mandatory: false, notes: 'Letter from employer, pay stubs' });
      documents.push({ name: 'Proof of ties to home country', mandatory: true, notes: 'Property, family, employment' });
    }

    return documents;
  }

  generateTips(visaInfo, destination) {
    const tips = [];

    if (!visaInfo.visaRequired) {
      tips.push('Check passport validity before booking');
      tips.push('Carry proof of accommodation at all times');
      tips.push('Ensure you have return/onward travel tickets');
    } else {
      tips.push('Apply well in advance of your travel date');
      tips.push('Double-check all documents before submission');
      tips.push('Keep copies of all submitted documents');
      tips.push('Track your application status online');
      tips.push('Apply for multi-entry visa if you plan to travel frequently');
    }

    return tips;
  }

  getEmbassyInfo(destination) {
    const embassies = {
      'United States': {
        website: 'https://www.usa.gov/visas',
        phone: '+1-202-555-0123',
        address: 'Washington D.C.',
        notes: 'Processing times vary by location'
      },
      'United Kingdom': {
        website: 'https://www.gov.uk/apply-to-come-to-the-uk',
        phone: '+44-20-7946-0958',
        address: 'London',
        notes: 'Use VFS Global for application centers'
      }
    };

    return embassies[destination] || {
      website: 'Check local embassy website',
      phone: 'Contact local embassy',
      address: 'Research local embassy location',
      notes: 'Embassy details should be verified'
    };
  }

  generateWarnings(nationality, destination, duration) {
    const warnings = [];

    if (duration > 90) {
      warnings.push('Longer stays may require special visa categories');
      warnings.push('Extended stays require additional documentation');
    }

    if (['United States', 'United Kingdom', 'Australia'].includes(destination)) {
      warnings.push('Interview may be required at embassy/consulate');
      warnings.push('Security clearance may add processing time');
    }

    return warnings;
  }
}

module.exports = new VisaAgent();