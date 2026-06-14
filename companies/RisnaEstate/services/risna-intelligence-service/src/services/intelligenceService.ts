/**
 * RisnaEstate AI Intelligence Service
 * NRI Detection, HNI Scoring, Investment Behavior Analysis
 */

import { logger } from '../config/logger';

export interface LeadProfile {
  name: string;
  phone: string;
  email?: string;
  source: string;
  city?: string;
  country?: string;
  interestedCountries?: string[];
  budget?: { min: number; max: number; currency: string };
  timeline?: string;
  purpose?: string;
  propertyTypes?: string[];
}

export interface IntelligenceScore {
  overall: number;
  nriProbability: number;
  hniScore: number;
  investorScore: number;
  urgencyScore: number;
  engagementScore: number;
  affordabilityScore: number;
  visaProbability: number;
  recommendations: string[];
}

export class IntelligenceService {

  /**
   * NRI Probability Score (0-100)
   * Based on phone country code, email domain, source
   */
  calculateNRIProbability(profile: LeadProfile): number {
    let score = 0;

    // Phone country code analysis
    if (profile.phone) {
      const phone = profile.phone.replace(/\s/g, '');
      if (phone.startsWith('+971') || phone.startsWith('+1') || phone.startsWith('+44') || phone.startsWith('+65')) {
        score += 40; // UAE, US, UK, Singapore
      }
      if (phone.startsWith('+966') || phone.startsWith('+968') || phone.startsWith('+965')) {
        score += 35; // GCC countries
      }
      if (phone.startsWith('+91') && profile.source === 'referral') {
        score += 20; // Indian referral for NRI
      }
    }

    // Email domain analysis
    if (profile.email) {
      const domain = profile.email.split('@')[1]?.toLowerCase() || '';
      const nriDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      const globalDomains = ['.ae', '.us', '.uk', '.sg', '.uk', '.ca', '.au'];
      const indianDomains = ['.in'];

      if (nriDomains.includes(domain)) score += 15;
      if (globalDomains.some(d => domain.endsWith(d))) score += 25;
      if (indianDomains.some(d => domain.endsWith(d))) score -= 10;
    }

    // Interest in international properties
    if (profile.interestedCountries?.length) {
      const hasInternational = profile.interestedCountries.some(c => c !== 'IN');
      if (hasInternational) score += 20;
    }

    // Dubai interest specific signals
    if (profile.source === 'referral' && profile.interestedCountries?.includes('AE')) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * HNI (High Net Worth Individual) Score (0-100)
   * Based on budget, property types, investment interest
   */
  calculateHNIScore(profile: LeadProfile): number {
    let score = 0;

    // Budget analysis
    if (profile.budget) {
      const maxBudget = profile.budget.max || profile.budget.min;

      if (profile.budget.currency === 'AED') {
        if (maxBudget >= 10000000) score += 40; // 1Cr+ AED
        else if (maxBudget >= 5000000) score += 25;
        else if (maxBudget >= 2000000) score += 10;
      } else {
        if (maxBudget >= 50000000) score += 40; // 5Cr+ INR
        else if (maxBudget >= 20000000) score += 25;
        else if (maxBudget >= 5000000) score += 10;
      }
    }

    // Property type analysis (luxury indicators)
    if (profile.propertyTypes?.length) {
      const luxuryTypes = ['villa', 'penthouse', 'bungalow', 'penthouse'];
      const hasLuxury = profile.propertyTypes.some(t => luxuryTypes.includes(t.toLowerCase()));
      if (hasLuxury) score += 20;
    }

    // Purpose analysis
    if (profile.purpose === 'invest') {
      score += 15;
    } else if (profile.purpose === 'buy') {
      score += 10;
    }

    // Timeline (immediate = serious buyer)
    if (profile.timeline === 'immediate') {
      score += 15;
    } else if (profile.timeline === '1-3months') {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Investor Score (0-100)
   * Likelihood of investment purchase
   */
  calculateInvestorScore(profile: LeadProfile): number {
    let score = 0;

    // Purpose
    if (profile.purpose === 'invest') score += 30;

    // Timeline
    if (profile.timeline === 'immediate') score += 20;
    else if (profile.timeline === '1-3months') score += 15;
    else if (profile.timeline === '3-6months') score += 5;

    // Budget (investment grade)
    if (profile.budget) {
      const minBudget = profile.budget.min || 0;
      if (minBudget >= 5000000) score += 25;
      else if (minBudget >= 2000000) score += 15;
      else if (minBudget >= 500000) score += 5;
    }

    // Source quality
    const sourceWeight: Record<string, number> = {
      referral: 15,
      ad: 10,
      organic: 5,
      website: 5
    };
    score += sourceWeight[profile.source] || 5;

    // Multiple property interest
    if ((profile.propertyTypes?.length || 0) >= 2) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Visa Probability Score (0-100)
   * Likelihood of Golden Visa interest
   */
  calculateVisaProbability(profile: LeadProfile): number {
    let score = 0;

    // Already interested in UAE
    if (profile.interestedCountries?.includes('AE')) score += 30;

    // High budget for visa requirements (AED 2M+)
    if (profile.budget?.currency === 'AED' && profile.budget.min >= 2000000) {
      score += 30;
    } else if (profile.budget?.currency === 'AED' && profile.budget.min >= 545000) {
      score += 20;
    }

    // Investment purpose
    if (profile.purpose === 'invest') score += 20;

    // NRI status boosts visa probability
    const nriProb = this.calculateNRIProbability(profile);
    if (nriProb > 50) score += 15;

    // HNI boosts visa probability
    const hniScore = this.calculateHNIScore(profile);
    if (hniScore > 50) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Urgency Score (0-100)
   * How soon they might convert
   */
  calculateUrgencyScore(profile: LeadProfile): number {
    let score = 50; // Base score

    const timelineWeight: Record<string, number> = {
      immediate: 40,
      '1-3months': 25,
      '3-6months': 10,
      '6-12months': 0,
      '12months+': -10
    };
    score += timelineWeight[profile.timeline || ''] || 0;

    // High budget = more urgency
    if (profile.budget && profile.budget.min >= 5000000) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Engagement Score (0-100)
   * Based on lead source quality
   */
  calculateEngagementScore(profile: LeadProfile): number {
    const sourceWeight: Record<string, number> = {
      referral: 90,
      ad: 70,
      organic: 60,
      website: 50,
      social: 40
    };
    return sourceWeight[profile.source] || 50;
  }

  /**
   * Affordability Score (0-100)
   * Budget vs. market prices
   */
  calculateAffordabilityScore(profile: LeadProfile): number {
    if (!profile.budget) return 50;

    let score = 50;
    const budget = profile.budget;

    // High budget = high affordability
    const maxBudget = budget.max || budget.min;

    if (budget.currency === 'AED') {
      if (maxBudget >= 10000000) score += 40;
      else if (maxBudget >= 5000000) score += 25;
      else if (maxBudget >= 2000000) score += 10;
    } else {
      if (maxBudget >= 50000000) score += 40;
      else if (maxBudget >= 20000000) score += 25;
      else if (maxBudget >= 5000000) score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(profile: LeadProfile, scores: IntelligenceScore): string[] {
    const recommendations: string[] = [];

    // Visa recommendations
    if (scores.visaProbability > 60) {
      recommendations.push('Send Golden Visa eligibility guide');
      recommendations.push('Schedule visa consultation call');
    }

    // NRI recommendations
    if (scores.nriProbability > 50) {
      recommendations.push('Connect with NRI-specific property tour');
      recommendations.push('Share Dubai property video');
    }

    // HNI recommendations
    if (scores.hniScore > 70) {
      recommendations.push('Offer exclusive VIP property viewing');
      recommendations.push('Connect with luxury property specialist');
    }

    // Investor recommendations
    if (scores.investorScore > 60) {
      recommendations.push('Send ROI comparison report');
      recommendations.push('Share investment property analysis');
    }

    // Urgency recommendations
    if (scores.urgencyScore > 70) {
      recommendations.push('Priority site visit scheduling');
      recommendations.push('Offer limited-time incentive');
    }

    // Budget-based recommendations
    if (profile.budget?.min >= 5000000) {
      recommendations.push('Share premium property listings');
    } else {
      recommendations.push('Show value-for-money options');
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Full Intelligence Analysis
   */
  analyzeLead(profile: LeadProfile): IntelligenceScore {
    const nriProbability = this.calculateNRIProbability(profile);
    const hniScore = this.calculateHNIScore(profile);
    const investorScore = this.calculateInvestorScore(profile);
    const urgencyScore = this.calculateUrgencyScore(profile);
    const engagementScore = this.calculateEngagementScore(profile);
    const affordabilityScore = this.calculateAffordabilityScore(profile);
    const visaProbability = this.calculateVisaProbability(profile);

    // Weighted overall score
    const overall = Math.round(
      nriProbability * 0.15 +
      hniScore * 0.20 +
      investorScore * 0.20 +
      urgencyScore * 0.15 +
      engagementScore * 0.10 +
      affordabilityScore * 0.10 +
      visaProbability * 0.10
    );

    const scores: IntelligenceScore = {
      overall,
      nriProbability,
      hniScore,
      investorScore,
      urgencyScore,
      engagementScore,
      affordabilityScore,
      visaProbability,
      recommendations: []
    };

    scores.recommendations = this.generateRecommendations(profile, scores);

    logger.info('Lead intelligence analyzed', {
      name: profile.name,
      overall,
      nriProbability,
      hniScore,
      investorScore
    });

    return scores;
  }

  /**
   * Segment Classification
   */
  classifyLead(scores: IntelligenceScore): string {
    if (scores.nriProbability >= 60 && scores.hniScore >= 50) return 'nri_hni';
    if (scores.nriProbability >= 60) return 'nri';
    if (scores.hniScore >= 70) return 'hni';
    if (scores.investorScore >= 60) return 'investor';
    if (scores.urgencyScore >= 60) return 'urgent';
    if (scores.overall >= 60) return 'hot';
    if (scores.overall >= 40) return 'warm';
    return 'cold';
  }
}

export const intelligenceService = new IntelligenceService();
