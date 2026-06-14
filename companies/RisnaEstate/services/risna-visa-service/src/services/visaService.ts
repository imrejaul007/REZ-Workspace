import { VisaEligibility, IVisaEligibility, IVisaProfile, VisaProgramType, UAE_VISA_PROGRAMS, Country, VisaAssessmentStatus } from '../models/VisaEligibility';
import { logger } from '../config/logger';

export interface CreateVisaAssessmentInput {
  userId: string;
  email?: string;
  phone?: string;
  country: Country;
  profile?: Partial<IVisaProfile>;
  investments?: Array<{
    propertyId?: string;
    propertyValue?: number;
    currency?: string;
    ownershipPercentage?: number;
  }>;
}

export interface EligibilityCheckResult {
  eligible: boolean;
  program: string;
  eligibilityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedApprovalChance: number;
  missingCriteria?: string[];
  recommendations?: string[];
}

export class VisaService {
  /**
   * Start a new visa eligibility assessment
   */
  async createAssessment(input: CreateVisaAssessmentInput): Promise<IVisaEligibility> {
    // Calculate initial eligibility
    const eligibilityCheck = await this.checkEligibility(input);

    const assessment = new VisaEligibility({
      userId: input.userId,
      email: input.email,
      phone: input.phone,
      country: input.country,
      profile: input.profile,
      investments: input.investments,
      totalInvestmentValue: input.investments?.reduce((sum, inv) => sum + (inv.propertyValue || 0), 0) || 0,
      assessment: {
        status: VisaAssessmentStatus.IN_PROGRESS,
        eligibilityScore: eligibilityCheck.eligibilityScore,
        riskLevel: eligibilityCheck.riskLevel,
        estimatedApprovalChance: eligibilityCheck.estimatedApprovalChance
      },
      missingDocuments: this.getMissingDocuments(input)
    });

    await assessment.save();
    logger.info('Visa assessment created', { userId: input.userId, country: input.country });

    return assessment;
  }

  /**
   * Get assessment by ID
   */
  async getById(id: string): Promise<IVisaEligibility | null> {
    return VisaEligibility.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Get assessments by user
   */
  async getByUser(userId: string): Promise<IVisaEligibility[]> {
    return VisaEligibility.find({ userId, deletedAt: null }).sort({ createdAt: -1 });
  }

  /**
   * Check eligibility for a user profile
   */
  async checkEligibility(input: CreateVisaAssessmentInput): Promise<EligibilityCheckResult> {
    const program = UAE_VISA_PROGRAMS[input.country === Country.UAE ? VisaProgramType.GOLDEN_VISA : VisaProgramType.GOLDEN_VISA];

    let score = 0;
    const missingCriteria: string[] = [];
    const recommendations: string[] = [];

    // Check investment amount
    const totalInvestment = input.investments?.reduce((sum, inv) => sum + (inv.propertyValue || 0), 0) || 0;

    if (totalInvestment >= program.minimumInvestment) {
      score += 40; // Investment contribution
    } else {
      missingCriteria.push(`Minimum investment of ${program.minimumInvestment} AED required`);
      recommendations.push(`Add property investment of ${program.minimumInvestment - totalInvestment} AED to qualify`);
    }

    // Check age (18-65 for most programs)
    const age = input.profile?.age || 35;
    if (age >= 21 && age <= 65) {
      score += 10;
    } else if (age < 21) {
      score += 5;
      recommendations.push('You must be at least 21 years old');
    } else {
      score += 5;
      recommendations.push('Age may affect visa eligibility');
    }

    // Check income
    const annualIncome = input.profile?.annualIncome || 0;
    if (annualIncome >= 250000) { // 250K AED/year
      score += 15;
    } else if (annualIncome >= 100000) {
      score += 10;
    } else if (annualIncome > 0) {
      score += 5;
      recommendations.push('Higher income improves eligibility');
    }

    // Check net worth
    const netWorth = input.profile?.netWorth || 0;
    if (netWorth >= 5000000) { // 5M AED
      score += 20;
    } else if (netWorth >= 1000000) {
      score += 15;
    } else if (netWorth >= 500000) {
      score += 10;
    }

    // Check education
    const educationLevel = input.profile?.educationLevel;
    if (educationLevel === 'phd' || educationLevel === 'masters') {
      score += 15;
    } else if (educationLevel === 'bachelors') {
      score += 10;
    }

    // Determine eligibility and risk
    const eligible = score >= program.passingPoints;
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (score >= 80) riskLevel = 'low';
    else if (score < 50) riskLevel = 'high';

    const approvalChance = Math.min(95, Math.max(5, score + (eligible ? 5 : -10)));

    return {
      eligible,
      program: program.name,
      eligibilityScore: Math.round(score),
      riskLevel,
      estimatedApprovalChance: Math.round(approvalChance),
      missingCriteria: missingCriteria.length > 0 ? missingCriteria : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  }

  /**
   * Get available visa programs
   */
  getPrograms(country: Country = Country.UAE): any[] {
    return Object.entries(UAE_VISA_PROGRAMS).map(([key, program]) => ({
      id: key,
      name: program.name,
      description: program.description,
      minimumInvestment: program.minimumInvestment,
      currency: program.currency,
      investmentTypes: program.investmentTypes,
      passingPoints: program.passingPoints
    }));
  }

  /**
   * Calculate points for a program
   */
  calculatePoints(
    assessment: IVisaEligibility,
    programType: VisaProgramType
  ): { total: number; passingPoints: number; breakdown: Record<string, { earned: number; max: number }> } {
    const program = UAE_VISA_PROGRAMS[programType];
    const breakdown: Record<string, { earned: number; max: number }> = {};

    let total = 0;

    // Investment points
    const investmentValue = assessment.totalInvestmentValue || 0;
    const investmentWeight = program.pointsBreakdown?.investment?.weight || 40;
    const investmentMax = program.pointsBreakdown?.investment?.max || 40;
    const investmentEarned = Math.min(investmentMax, (investmentValue / program.minimumInvestment) * investmentWeight);
    breakdown.investment = { earned: Math.round(investmentEarned), max: investmentMax };
    total += investmentEarned;

    // Age points
    const age = assessment.profile?.age || 35;
    const ageWeight = program.pointsBreakdown?.age?.weight || 10;
    const ageMax = program.pointsBreakdown?.age?.max || 10;
    let ageEarned = ageWeight;
    if (age < 21 || age > 65) ageEarned = ageWeight * 0.5;
    breakdown.age = { earned: Math.round(ageEarned), max: ageMax };
    total += ageEarned;

    // Language points (assumed for now)
    const languageWeight = program.pointsBreakdown?.language?.weight || 15;
    const languageMax = program.pointsBreakdown?.language?.max || 15;
    const languageEarned = assessment.profile?.nationality === 'AE' ? languageWeight : languageWeight * 0.5;
    breakdown.language = { earned: Math.round(languageEarned), max: languageMax };
    total += languageEarned;

    return {
      total: Math.round(total),
      passingPoints: program.passingPoints || 100,
      breakdown
    };
  }

  /**
   * Get document requirements for a program
   */
  getDocumentRequirements(programType: VisaProgramType): Array<{ type: string; name: string; required: boolean; description: string }> {
    const requirements: Record<VisaProgramType, Array<{ type: string; name: string; required: boolean; description: string }>> = {
      [VisaProgramType.GOLDEN_VISA]: [
        { type: 'passport', name: 'Valid Passport', required: true, description: 'Minimum 6 months validity' },
        { type: 'photo', name: 'Passport Photo', required: true, description: 'White background, recent' },
        { type: 'property_deed', name: 'Property Deed', required: true, description: 'Title deed showing ownership' },
        { type: 'bank_statement', name: 'Bank Statement', required: true, description: 'Last 6 months, certified' },
        { type: 'income_proof', name: 'Income Proof', required: false, description: 'Salary certificate or investment proof' },
        { type: 'emirates_id', name: 'Emirates ID', required: false, description: 'If already residing in UAE' }
      ],
      [VisaProgramType.INVESTOR_VISA]: [
        { type: 'passport', name: 'Valid Passport', required: true, description: 'Minimum 6 months validity' },
        { type: 'photo', name: 'Passport Photo', required: true, description: 'White background' },
        { type: 'property_deed', name: 'Property Deed', required: true, description: 'Property ownership proof' },
        { type: 'valuation', name: 'Property Valuation', required: true, description: 'Official valuation certificate' }
      ],
      [VisaProgramType.RETIREMENT_VISA]: [
        { type: 'passport', name: 'Valid Passport', required: true, description: 'Minimum 6 months validity' },
        { type: 'photo', name: 'Passport Photo', required: true, description: 'White background' },
        { type: 'age_proof', name: 'Age Proof', required: true, description: 'Birth certificate or passport' },
        { type: 'income_proof', name: 'Income Proof', required: true, description: 'Pension or investment proof' }
      ],
      [VisaProgramType.SILVER_VISA]: [],
      [VisaProgramType.FREELANCER_VISA]: []
    };

    return requirements[programType] || [];
  }

  /**
   * Update assessment
   */
  async update(id: string, updates: Partial<IVisaEligibility>): Promise<IVisaEligibility | null> {
    const assessment = await VisaEligibility.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updates },
      { new: true }
    );
    if (assessment) {
      logger.info('Visa assessment updated', { assessmentId: id });
    }
    return assessment;
  }

  /**
   * Upload document
   */
  async uploadDocument(
    assessmentId: string,
    document: { type: string; name: string; url: string }
  ): Promise<IVisaEligibility | null> {
    const assessment = await VisaEligibility.findById(assessmentId);
    if (!assessment) return null;

    assessment.documents = assessment.documents || [];
    assessment.documents.push({
      ...document,
      status: 'uploaded',
      uploadedAt: new Date()
    });

    await assessment.save();
    logger.info('Document uploaded', { assessmentId, type: document.type });

    return assessment;
  }

  /**
   * Get missing documents
   */
  private getMissingDocuments(input: CreateVisaAssessmentInput): string[] {
    const required: string[] = ['Valid Passport', 'Passport Photo'];

    if ((input.investments?.reduce((sum, inv) => sum + (inv.propertyValue || 0), 0) || 0) > 0) {
      required.push('Property Deed');
    }

    if (!input.profile?.annualIncome || input.profile.annualIncome < 100000) {
      required.push('Income Proof');
    }

    return required;
  }

  /**
   * Get assessment statistics
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    avgScore: number;
    byCountry: Record<string, number>;
  }> {
    const stats = await VisaEligibility.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgScore: { $avg: '$assessment.eligibilityScore' },
          inProgress: { $sum: { $cond: [{ $eq: ['$assessment.status', 'in_progress'] }, 1, 0] } },
          submitted: { $sum: { $cond: [{ $eq: ['$assessment.status', 'submitted'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$assessment.status', 'approved'] }, 1, 0] } },
          inUAe: { $sum: { $cond: [{ $eq: ['$country', 'AE'] }, 1, 0] } }
        }
      }
    ]);

    if (stats.length === 0) {
      return { total: 0, byStatus: {}, avgScore: 0, byCountry: {} };
    }

    return {
      total: stats[0].total,
      byStatus: {
        in_progress: stats[0].inProgress,
        submitted: stats[0].submitted,
        approved: stats[0].approved
      },
      avgScore: Math.round(stats[0].avgScore || 0),
      byCountry: {
        AE: stats[0].inUAe
      }
    };
  }
}

export const visaService = new VisaService();
