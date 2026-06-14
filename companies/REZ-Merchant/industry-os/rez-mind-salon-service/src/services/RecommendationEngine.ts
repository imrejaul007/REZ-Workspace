import { z } from 'zod';
import { logger } from '../utils/logger';

// Types
export interface CustomerProfile {
  customerId: string;
  hairType?: 'straight' | 'wavy' | 'curly' | 'coily';
  hairTexture?: 'fine' | 'medium' | 'coarse';
  scalpCondition?: 'normal' | 'oily' | 'dry' | 'sensitive';
  colorHistory?: string[];
  stylePreferences?: string[];
  allergies?: string[];
  lastVisits: VisitRecord[];
}

export interface VisitRecord {
  date: string;
  services: string[];
  stylistId: string;
  satisfaction?: number;
}

export interface ServiceRecommendation {
  serviceId: string;
  serviceName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  estimatedPrice: number;
  suggestedAddOns?: string[];
}

export interface UpsellSuggestion {
  primaryService: string;
  suggestedService: string;
  reason: string;
  discount?: number;
  conversionProbability: number;
}

// Schemas
const VisitRecordSchema = z.object({
  date: z.string(),
  services: z.array(z.string()),
  stylistId: z.string(),
  satisfaction: z.number().optional(),
});

const CustomerProfileSchema = z.object({
  customerId: z.string(),
  hairType: z.enum(['straight', 'wavy', 'curly', 'coily']).optional(),
  hairTexture: z.enum(['fine', 'medium', 'coarse']).optional(),
  scalpCondition: z.enum(['normal', 'oily', 'dry', 'sensitive']).optional(),
  colorHistory: z.array(z.string()).optional(),
  stylePreferences: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  lastVisits: z.array(VisitRecordSchema).default([]),
});

// Service catalog with compatibility rules
const serviceCatalog: Record<
  string,
  {
    name: string;
    basePrice: number;
    compatibleHairTypes: string[];
    compatibleTextures: string[];
    addOns: string[];
    maintenanceWeeks: number;
  }
> = {
  haircut: {
    name: 'Haircut',
    basePrice: 30,
    compatibleHairTypes: ['straight', 'wavy', 'curly', 'coily'],
    compatibleTextures: ['fine', 'medium', 'coarse'],
    addOns: ['deepCondition', 'scalpMassage'],
    maintenanceWeeks: 4,
  },
  coloring: {
    name: 'Hair Coloring',
    basePrice: 80,
    compatibleHairTypes: ['straight', 'wavy', 'curly', 'coily'],
    compatibleTextures: ['medium', 'coarse'],
    addOns: ['colorProtect', 'deepCondition'],
    maintenanceWeeks: 6,
  },
  balayage: {
    name: 'Balayage',
    basePrice: 150,
    compatibleHairTypes: ['straight', 'wavy', 'curly'],
    compatibleTextures: ['medium', 'coarse'],
    addOns: ['toner', 'deepCondition', 'glossTreatment'],
    maintenanceWeeks: 12,
  },
  keratin: {
    name: 'Keratin Treatment',
    basePrice: 200,
    compatibleHairTypes: ['wavy', 'curly', 'coily'],
    compatibleTextures: ['medium', 'coarse'],
    addOns: ['deepCondition', 'smoothingMask'],
    maintenanceWeeks: 16,
  },
  deepCondition: {
    name: 'Deep Conditioning',
    basePrice: 25,
    compatibleHairTypes: ['straight', 'wavy', 'curly', 'coily'],
    compatibleTextures: ['fine', 'medium', 'coarse'],
    addOns: [],
    maintenanceWeeks: 2,
  },
  scalpTreatment: {
    name: 'Scalp Treatment',
    basePrice: 40,
    compatibleHairTypes: ['straight', 'wavy', 'curly', 'coily'],
    compatibleTextures: ['fine', 'medium', 'coarse'],
    addOns: ['scalpMassage', 'deepCondition'],
    maintenanceWeeks: 4,
  },
  blowout: {
    name: 'Blowout/Styling',
    basePrice: 35,
    compatibleHairTypes: ['straight', 'wavy', 'curly', 'coily'],
    compatibleTextures: ['fine', 'medium', 'coarse'],
    addOns: ['heatProtect', 'serum'],
    maintenanceWeeks: 1,
  },
};

export class RecommendationEngine {
  private customerProfiles: Map<string, CustomerProfile> = new Map();

  constructor() {
    this.initializeSampleProfiles();
  }

  private initializeSampleProfiles(): void {
    // Sample profiles for testing
    const sampleProfiles: CustomerProfile[] = [
      {
        customerId: 'sample-1',
        hairType: 'curly',
        hairTexture: 'coarse',
        scalpCondition: 'normal',
        colorHistory: ['brown', 'highlights'],
        stylePreferences: ['natural', 'low-maintenance'],
        lastVisits: [
          {
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            services: ['haircut', 'deepCondition'],
            stylistId: 'stylist-1',
          },
        ],
      },
      {
        customerId: 'sample-2',
        hairType: 'straight',
        hairTexture: 'fine',
        scalpCondition: 'oily',
        colorHistory: ['balayage', 'blonde'],
        stylePreferences: ['polished', 'professional'],
        lastVisits: [
          {
            date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            services: ['balayage', 'blowout'],
            stylistId: 'stylist-2',
          },
        ],
      },
    ];

    for (const profile of sampleProfiles) {
      this.customerProfiles.set(profile.customerId, profile);
    }
  }

  /**
   * Get personalized service recommendations for a customer
   */
  async getRecommendations(
    customerId: string,
    options?: { limit?: number; includeAddOns?: boolean }
  ): Promise<ServiceRecommendation[]> {
    const profile = this.customerProfiles.get(customerId);
    if (!profile) {
      logger.warn(`No profile found for customer ${customerId}`);
      return [];
    }

    const recommendations: ServiceRecommendation[] = [];
    const now = new Date();

    // Analyze visit history
    const lastVisit = profile.lastVisits?.[0];
    const daysSinceLastVisit = lastVisit
      ? Math.floor(
          (now.getTime() - new Date(lastVisit.date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 999;

    // Recommend based on maintenance schedule
    for (const [serviceId, service] of Object.entries(serviceCatalog)) {
      if (daysSinceLastVisit >= service.maintenanceWeeks * 7) {
        const priority = this.calculatePriority(
          daysSinceLastVisit,
          service.maintenanceWeeks * 7
        );

        const reason = this.generateRecommendationReason(
          serviceId,
          profile,
          daysSinceLastVisit
        );

        recommendations.push({
          serviceId,
          serviceName: service.name,
          reason,
          priority,
          confidence: this.calculateConfidence(serviceId, profile),
          estimatedPrice: service.basePrice,
          suggestedAddOns:
            options?.includeAddOns !== false ? service.addOns : undefined,
        });
      }
    }

    // Add service-specific recommendations based on hair profile
    const hairRecommendations = this.getHairBasedRecommendations(profile);
    recommendations.push(...hairRecommendations);

    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.confidence - a.confidence;
    });

    return options?.limit
      ? recommendations.slice(0, options.limit)
      : recommendations;
  }

  /**
   * Calculate priority based on how overdue the service is
   */
  private calculatePriority(
    daysSinceVisit: number,
    maintenanceWeeks: number
  ): 'high' | 'medium' | 'low' {
    const threshold = maintenanceWeeks * 7;
    const overdueRatio = daysSinceVisit / threshold;

    if (overdueRatio >= 1.5) return 'high';
    if (overdueRatio >= 1.0) return 'medium';
    return 'low';
  }

  /**
   * Generate a human-readable reason for the recommendation
   */
  private generateRecommendationReason(
    serviceId: string,
    profile: CustomerProfile,
    daysSinceVisit: number
  ): string {
    const weeks = Math.floor(daysSinceVisit / 7);

    switch (serviceId) {
      case 'haircut':
        return `It's been ${weeks} weeks since your last cut. Regular trims keep your ${profile.hairType} hair healthy.`;
      case 'coloring':
        return `Your color typically lasts 6 weeks. Time for a touch-up to keep it fresh.`;
      case 'deepCondition':
        if (profile.hairTexture === 'coarse' || profile.hairTexture === 'fine') {
          return `${profile.hairTexture} hair benefits from weekly conditioning treatments.`;
        }
        return `Deep conditioning helps maintain your ${profile.hairType} hair's health and shine.`;
      case 'scalpTreatment':
        return `Recommended every 4 weeks for a healthy scalp.`;
      case 'blowout':
        return `Perfect for maintaining your polished look between appointments.`;
      default:
        return `Based on your service history and hair profile.`;
    }
  }

  /**
   * Calculate confidence score for recommendation
   */
  private calculateConfidence(serviceId: string, profile: CustomerProfile): number {
    const service = serviceCatalog[serviceId];
    let confidence = 0.7;

    // Check hair type compatibility
    if (
      profile.hairType &&
      service.compatibleHairTypes.includes(profile.hairType)
    ) {
      confidence += 0.15;
    }

    // Check texture compatibility
    if (
      profile.hairTexture &&
      service.compatibleTextures.includes(profile.hairTexture)
    ) {
      confidence += 0.1;
    }

    // Check service history
    const hasHistory = profile.lastVisits?.some((v) =>
      v.services.includes(serviceId)
    );
    if (hasHistory) {
      confidence += 0.05;
    }

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Get recommendations based on hair type and texture
   */
  private getHairBasedRecommendations(
    profile: CustomerProfile
  ): ServiceRecommendation[] {
    const recommendations: ServiceRecommendation[] = [];

    if (!profile.hairType || !profile.hairTexture) {
      return recommendations;
    }

    // Curly/coily hair recommendations
    if (['curly', 'coily'].includes(profile.hairType)) {
      recommendations.push({
        serviceId: 'keratin',
        serviceName: serviceCatalog.keratin.name,
        reason: `Keratin treatments are excellent for managing ${profile.hairType} hair and reducing styling time.`,
        priority: 'medium',
        confidence: 0.75,
        estimatedPrice: serviceCatalog.keratin.basePrice,
      });
    }

    // Fine hair recommendations
    if (profile.hairTexture === 'fine') {
      recommendations.push({
        serviceId: 'volumizing',
        serviceName: 'Volumizing Treatment',
        reason: `Fine hair benefits from volumizing treatments to add body and thickness.`,
        priority: 'low',
        confidence: 0.7,
        estimatedPrice: 45,
      });
    }

    // Dry scalp recommendations
    if (profile.scalpCondition === 'dry' || profile.scalpCondition === 'sensitive') {
      recommendations.push({
        serviceId: 'scalpTreatment',
        serviceName: serviceCatalog.scalpTreatment.name,
        reason: `Your ${profile.scalpCondition} scalp needs regular moisturizing treatments.`,
        priority: 'medium',
        confidence: 0.8,
        estimatedPrice: serviceCatalog.scalpTreatment.basePrice,
      });
    }

    return recommendations;
  }

  /**
   * Generate upsell suggestions based on current booking
   */
  async getUpsellSuggestions(
    currentService: string,
    customerId?: string
  ): Promise<UpsellSuggestion[]> {
    const suggestions: UpsellSuggestion[] = [];

    // Service pairing rules
    const pairings: Record<string, { service: string; reason: string; discount?: number }[]> = {
      haircut: [
        { service: 'deepCondition', reason: 'Keep your cut looking fresh with hydration', discount: 0.1 },
        { service: 'blowout', reason: 'Complete the look with professional styling' },
      ],
      coloring: [
        { service: 'deepCondition', reason: 'Protect your color with extra moisture', discount: 0.15 },
        { service: 'scalpTreatment', reason: 'Maintain a healthy scalp after coloring' },
      ],
      balayage: [
        { service: 'toner', reason: 'Maintain your balayage vibrancy', discount: 0.1 },
        { service: 'glossTreatment', reason: 'Add shine and smoothness' },
      ],
      keratin: [
        { service: 'smoothingMask', reason: 'Extend your keratin results', discount: 0.2 },
        { service: 'sulfateFreeShampoo', reason: 'Use professional products at home' },
      ],
    };

    const currentPairings = pairings[currentService] || [];

    for (const pairing of currentPairings) {
      suggestions.push({
        primaryService: currentService,
        suggestedService: pairing.service,
        reason: pairing.reason,
        discount: pairing.discount,
        conversionProbability: pairing.discount ? 0.65 : 0.45,
      });
    }

    // Personalize based on customer profile
    if (customerId) {
      const profile = this.customerProfiles.get(customerId);
      if (profile) {
        // Add profile-specific upsells
        if (profile.hairTexture === 'fine') {
          suggestions.push({
            primaryService: currentService,
            suggestedService: 'volumizingTreatment',
            reason: 'Add body and thickness to fine hair',
            conversionProbability: 0.55,
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Update customer profile
   */
  async updateCustomerProfile(profile: CustomerProfile): Promise<void> {
    const validated = CustomerProfileSchema.parse(profile);
    this.customerProfiles.set(validated.customerId, validated);
    logger.info(`Updated profile for customer ${validated.customerId}`);
  }

  /**
   * Get customer profile
   */
  async getCustomerProfile(customerId: string): Promise<CustomerProfile | null> {
    return this.customerProfiles.get(customerId) || null;
  }
}
