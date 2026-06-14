import { v4 as uuidv4 } from 'uuid';
import {
  OpinionReport,
  SecondOpinionRequest,
  Specialist,
  DataStore,
  RequestStatus,
  SubmitOpinionSchema
} from '../models/secondOpinion.js';
import { requestService } from './requestService.js';

export class OpinionService {
  private store: DataStore;

  constructor() {
    this.store = DataStore.getInstance();
  }

  async submitOpinion(data: {
    requestId: string;
    specialistId: string;
    diagnosis: string;
    treatmentPlan: string;
    alternativeOptions?: string[];
    confidence?: number;
    medications?: string[];
    lifestyleRecommendations?: string[];
    followUpRequired?: boolean;
  }): Promise<OpinionReport | null> {
    const validated = SubmitOpinionSchema.parse({
      diagnosis: data.diagnosis,
      treatmentPlan: data.treatmentPlan,
      alternativeOptions: data.alternativeOptions,
      confidence: data.confidence,
      medications: data.medications,
      lifestyleRecommendations: data.lifestyleRecommendations,
      followUpRequired: data.followUpRequired
    });

    const request = this.store.requests.get(data.requestId);
    if (!request) return null;

    const specialist = this.store.specialists.get(data.specialistId);
    if (!specialist) return null;

    const opinion: OpinionReport = {
      reportId: `OPN-${uuidv4().substring(0, 8).toUpperCase()}`,
      requestId: data.requestId,
      specialistId: data.specialistId,
      diagnosis: validated.diagnosis,
      treatmentPlan: validated.treatmentPlan,
      alternativeOptions: validated.alternativeOptions || [],
      confidence: validated.confidence,
      medications: validated.medications || [],
      lifestyleRecommendations: validated.lifestyleRecommendations || [],
      followUpRequired: validated.followUpRequired || false,
      createdAt: new Date().toISOString(),
      specialistName: specialist.name,
      specialistCredentials: specialist.credentials
    };

    this.store.opinions.set(opinion.reportId, opinion);

    // Update request status
    request.status = RequestStatus.UNDER_REVIEW;
    if (!request.assignedSpecialistId) {
      request.assignedSpecialistId = data.specialistId;
    }
    this.store.requests.set(request.requestId, request);

    // Store the match if not exists
    const existingMatches = this.store.matches.get(data.requestId) || [];
    const matchExists = existingMatches.some(m => m.specialistId === data.specialistId);
    if (!matchExists) {
      existingMatches.push({
        requestId: data.requestId,
        specialistId: data.specialistId,
        matchScore: 100,
        matchedCriteria: { specialty: 100, experience: 100, language: 100, availability: 100, rating: 100, fee: 100 },
        reason: 'Opinion submitted by specialist'
      });
      this.store.matches.set(data.requestId, existingMatches);
    }

    return opinion;
  }

  async getOpinion(reportId: string): Promise<OpinionReport | null> {
    return this.store.opinions.get(reportId) || null;
  }

  async getRequestOpinions(requestId: string): Promise<OpinionReport[]> {
    const opinions: OpinionReport[] = [];
    this.store.opinions.forEach(opinion => {
      if (opinion.requestId === requestId) {
        opinions.push(opinion);
      }
    });
    return opinions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOpinionsByRequest(requestId: string): Promise<OpinionReport[]> {
    return this.getRequestOpinions(requestId);
  }

  async getSpecialistOpinions(specialistId: string): Promise<OpinionReport[]> {
    const opinions: OpinionReport[] = [];
    this.store.opinions.forEach(opinion => {
      if (opinion.specialistId === specialistId) {
        opinions.push(opinion);
      }
    });
    return opinions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOpinionSummary(requestId: string): Promise<{
    totalOpinions: number;
    averageConfidence: number;
    consensusDiagnosis?: string;
    recommendedTreatments: string[];
    followUpsRequired: number;
  } | null> {
    const opinions = await this.getRequestOpinions(requestId);
    if (opinions.length === 0) return null;

    const averageConfidence = opinions.reduce((sum, o) => sum + o.confidence, 0) / opinions.length;
    const followUpsRequired = opinions.filter(o => o.followUpRequired).length;

    // Simple consensus: most common treatment plan keywords
    const treatmentKeywords = opinions
      .flatMap(o => o.treatmentPlan.toLowerCase().split(' '))
      .filter(w => w.length > 4);

    const recommendedTreatments = [...new Set(treatmentKeywords)].slice(0, 5);

    return {
      totalOpinions: opinions.length,
      averageConfidence: Math.round(averageConfidence * 10) / 10,
      consensusDiagnosis: opinions[0].diagnosis,
      recommendedTreatments,
      followUpsRequired
    };
  }

  async completeRequest(requestId: string): Promise<boolean> {
    const request = this.store.requests.get(requestId);
    if (!request) return false;

    request.status = RequestStatus.COMPLETED;
    request.completedAt = new Date().toISOString();
    this.store.requests.set(requestId, request);
    return true;
  }

  async getPatientOpinions(patientId: string): Promise<(OpinionReport & { request: SecondOpinionRequest })[]> {
    const results: (OpinionReport & { request: SecondOpinionRequest })[] = [];

    this.store.requests.forEach(request => {
      if (request.patientId === patientId) {
        const opinions = this.store.opinions;
        opinions.forEach(opinion => {
          if (opinion.requestId === request.requestId) {
            results.push({ ...opinion, request });
          }
        });
      }
    });

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const opinionService = new OpinionService();
