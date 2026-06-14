/**
 * REZ Survey Service
 * In-memory data store for guest surveys (NPS, CSAT, CES)
 */

import { v4 as uuidv4 } from 'uuid';

// Types
export enum SurveyType {
  NPS = 'nps',
  CSAT = 'csat',
  CES = 'ces',
}

export enum SurveyChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in_app',
}

export enum SurveyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

export enum SurveyAlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlertType {
  LOW_NPS = 'low_nps',
  DETRACTOR = 'detractor',
  URGENT_COMMENT = 'urgent_comment',
  RESPONSE_SPIKE = 'response_spike',
}

export enum AlertStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

export enum ResponseSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

export interface SurveyQuestion {
  id: string;
  type: 'rating' | 'nps' | 'text' | 'multiple_choice' | 'scale';
  question: string;
  required: boolean;
  options?: Array<{ value: string | number; label: string }>;
  scaleMin?: number;
  scaleMax?: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface SurveyTemplate {
  templateId: string;
  hotelId: string | null; // null = global
  name: string;
  type: SurveyType;
  questions: SurveyQuestion[];
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Survey {
  surveyId: string;
  hotelId: string;
  templateId: string;
  name: string;
  status: SurveyStatus;
  channels: SurveyChannel[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SurveyResponse {
  responseId: string;
  surveyId: string;
  hotelId: string;
  guestId: string;
  bookingId: string;
  templateType: SurveyType;
  npsScore?: number;
  npsCategory?: string;
  csatScore?: number;
  cesScore?: number;
  overallScore?: number;
  answers: Array<{
    questionId: string;
    question: string;
    score?: number;
    comment?: string;
  }>;
  sentiment: ResponseSentiment;
  sentimentScore: number;
  duration?: number;
  createdAt: Date;
}

export interface SurveyAlert {
  alertId: string;
  hotelId: string;
  type: AlertType;
  severity: SurveyAlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

// In-memory data stores
const templates = new Map<string, SurveyTemplate>();
const surveys = new Map<string, Survey>();
const responses = new Map<string, SurveyResponse>();
const alerts = new Map<string, SurveyAlert>();

// Helper functions
function generateId(): string {
  return uuidv4().slice(0, 8).toUpperCase();
}

// NPS Category calculation
export function getNPSCategory(score: number): string {
  if (score >= 9) return 'Promoter';
  if (score >= 7) return 'Passive';
  return 'Detractor';
}

// Sentiment analysis
function analyzeSentiment(text: string): { sentiment: ResponseSentiment; score: number } {
  const positiveWords = ['excellent', 'amazing', 'great', 'wonderful', 'fantastic', 'perfect', 'best', 'loved'];
  const negativeWords = ['terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointing', 'poor', 'dirty', 'rude'];

  const lowerText = text.toLowerCase();
  let score = 0;

  for (const word of positiveWords) {
    if (lowerText.includes(word)) score += 1;
  }
  for (const word of negativeWords) {
    if (lowerText.includes(word)) score -= 1;
  }

  const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(lowerText.split(/\s+/).length, 1) * 10));

  let sentiment: ResponseSentiment;
  if (normalizedScore > 0.2) {
    sentiment = ResponseSentiment.POSITIVE;
  } else if (normalizedScore < -0.2) {
    sentiment = ResponseSentiment.NEGATIVE;
  } else {
    sentiment = ResponseSentiment.NEUTRAL;
  }

  return { sentiment, score: normalizedScore };
}

// Template Functions
export function createTemplate(
  name: string,
  type: SurveyType,
  questions: SurveyQuestion[],
  hotelId?: string
): SurveyTemplate {
  const templateId = `TPL-${generateId()}`;
  const now = new Date();

  const template: SurveyTemplate = {
    templateId,
    hotelId: hotelId || null,
    name,
    type,
    questions,
    isGlobal: !hotelId,
    createdAt: now,
    updatedAt: now,
  };

  templates.set(templateId, template);
  return template;
}

export function getTemplate(templateId: string): SurveyTemplate | undefined {
  return templates.get(templateId);
}

export function getTemplatesByHotel(hotelId: string): SurveyTemplate[] {
  const result: SurveyTemplate[] = [];
  for (const t of templates.values()) {
    if (t.hotelId === hotelId || t.isGlobal) {
      result.push(t);
    }
  }
  return result;
}

export function getGlobalTemplates(): SurveyTemplate[] {
  const result: SurveyTemplate[] = [];
  for (const t of templates.values()) {
    if (t.isGlobal) {
      result.push(t);
    }
  }
  return result;
}

// Survey Functions
export function createSurvey(
  hotelId: string,
  templateId: string,
  name: string,
  channels: SurveyChannel[] = [SurveyChannel.EMAIL]
): Survey {
  const surveyId = `SURV-${generateId()}`;
  const now = new Date();

  const survey: Survey = {
    surveyId,
    hotelId,
    templateId,
    name,
    status: SurveyStatus.DRAFT,
    channels,
    isActive: false,
    createdAt: now,
    updatedAt: now,
  };

  surveys.set(surveyId, survey);
  return survey;
}

export function getSurvey(surveyId: string): Survey | undefined {
  return surveys.get(surveyId);
}

export function getSurveysByHotel(hotelId: string): Survey[] {
  const result: Survey[] = [];
  for (const s of surveys.values()) {
    if (s.hotelId === hotelId) {
      result.push(s);
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function activateSurvey(surveyId: string): Survey | undefined {
  const survey = surveys.get(surveyId);
  if (!survey) return undefined;

  survey.status = SurveyStatus.ACTIVE;
  survey.isActive = true;
  survey.updatedAt = new Date();

  surveys.set(surveyId, survey);
  return survey;
}

export function pauseSurvey(surveyId: string): Survey | undefined {
  const survey = surveys.get(surveyId);
  if (!survey) return undefined;

  survey.status = SurveyStatus.PAUSED;
  survey.isActive = false;
  survey.updatedAt = new Date();

  surveys.set(surveyId, survey);
  return survey;
}

export function closeSurvey(surveyId: string): Survey | undefined {
  const survey = surveys.get(surveyId);
  if (!survey) return undefined;

  survey.status = SurveyStatus.CLOSED;
  survey.isActive = false;
  survey.updatedAt = new Date();

  surveys.set(surveyId, survey);
  return survey;
}

// Response Functions
export function submitResponse(
  surveyId: string,
  hotelId: string,
  guestId: string,
  bookingId: string,
  templateType: SurveyType,
  answers: Array<{ questionId: string; question: string; score?: number; comment?: string }>,
  npsScore?: number,
  csatScore?: number,
  cesScore?: number,
  duration?: number
): SurveyResponse {
  const responseId = `RESP-${generateId()}`;
  const now = new Date();

  // Calculate sentiment from comments
  const comments = answers.filter(a => a.comment).map(a => a.comment).join(' ');
  const { sentiment, score } = comments ? analyzeSentiment(comments) : { sentiment: ResponseSentiment.NEUTRAL, score: 0 };

  // Calculate overall score
  let overallScore: number | undefined;
  if (npsScore !== undefined) {
    overallScore = npsScore;
  } else if (csatScore !== undefined) {
    overallScore = csatScore * 2; // Scale to 10
  } else if (cesScore !== undefined) {
    overallScore = cesScore * 10 / 7; // Scale to 10
  }

  const response: SurveyResponse = {
    responseId,
    surveyId,
    hotelId,
    guestId,
    bookingId,
    templateType,
    npsScore,
    npsCategory: npsScore !== undefined ? getNPSCategory(npsScore) : undefined,
    csatScore,
    cesScore,
    overallScore,
    answers,
    sentiment,
    sentimentScore: score,
    duration,
    createdAt: now,
  };

  responses.set(responseId, response);

  // Create alert for detractors
  if (npsScore !== undefined && npsScore <= 6) {
    createAlert(
      hotelId,
      AlertType.DETRACTOR,
      npsScore <= 4 ? SurveyAlertSeverity.CRITICAL : SurveyAlertSeverity.WARNING,
      `Detractor Feedback: NPS Score ${npsScore}`,
      `Guest gave NPS score of ${npsScore}/10. Immediate attention recommended.`
    );
  }

  return response;
}

export function getResponse(responseId: string): SurveyResponse | undefined {
  return responses.get(responseId);
}

export function getResponsesByHotel(hotelId: string): SurveyResponse[] {
  const result: SurveyResponse[] = [];
  for (const r of responses.values()) {
    if (r.hotelId === hotelId) {
      result.push(r);
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getResponsesBySurvey(surveyId: string): SurveyResponse[] {
  const result: SurveyResponse[] = [];
  for (const r of responses.values()) {
    if (r.surveyId === surveyId) {
      result.push(r);
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Alert Functions
export function createAlert(
  hotelId: string,
  type: AlertType,
  severity: SurveyAlertSeverity,
  title: string,
  message: string
): SurveyAlert {
  const alertId = `ALERT-${generateId()}`;

  const alert: SurveyAlert = {
    alertId,
    hotelId,
    type,
    severity,
    title,
    message,
    status: AlertStatus.NEW,
    createdAt: new Date(),
  };

  alerts.set(alertId, alert);
  return alert;
}

export function getAlert(alertId: string): SurveyAlert | undefined {
  return alerts.get(alertId);
}

export function getAlertsByHotel(hotelId: string, status?: AlertStatus): SurveyAlert[] {
  let result: SurveyAlert[] = [];
  for (const a of alerts.values()) {
    if (a.hotelId === hotelId) {
      if (!status || a.status === status) {
        result.push(a);
      }
    }
  }
  return result.sort((a, b) => {
    // Sort by severity first (critical first), then by date
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export function acknowledgeAlert(alertId: string, acknowledgedBy: string): SurveyAlert | undefined {
  const alert = alerts.get(alertId);
  if (!alert) return undefined;

  alert.status = AlertStatus.ACKNOWLEDGED;
  alert.acknowledgedBy = acknowledgedBy;
  alert.acknowledgedAt = new Date();

  alerts.set(alertId, alert);
  return alert;
}

export function resolveAlert(alertId: string, resolvedBy: string): SurveyAlert | undefined {
  const alert = alerts.get(alertId);
  if (!alert) return undefined;

  alert.status = AlertStatus.RESOLVED;
  alert.resolvedBy = resolvedBy;
  alert.resolvedAt = new Date();

  alerts.set(alertId, alert);
  return alert;
}

// Analytics Functions
export function getSurveyAnalytics(hotelId: string, period = 30): {
  totalResponses: number;
  avgNPS: number;
  avgCSAT: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps: number;
  sentimentBreakdown: Record<ResponseSentiment, number>;
  responseTrend: Array<{ date: string; count: number }>;
} {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - period);

  const hotelResponses = getResponsesByHotel(hotelId).filter(
    r => r.createdAt >= cutoffDate
  );

  // Calculate NPS
  const npsResponses = hotelResponses.filter(r => r.npsScore !== undefined);
  const promoters = npsResponses.filter(r => r.npsScore! >= 9).length;
  const passives = npsResponses.filter(r => r.npsScore! >= 7 && r.npsScore! < 9).length;
  const detractors = npsResponses.filter(r => r.npsScore! < 7).length;
  const nps = npsResponses.length > 0
    ? Math.round(((promoters - detractors) / npsResponses.length) * 100)
    : 0;
  const avgNPS = npsResponses.length > 0
    ? Math.round(npsResponses.reduce((sum, r) => sum + (r.npsScore || 0), 0) / npsResponses.length)
    : 0;

  // Calculate CSAT
  const csatResponses = hotelResponses.filter(r => r.csatScore !== undefined);
  const avgCSAT = csatResponses.length > 0
    ? Math.round(csatResponses.reduce((sum, r) => sum + (r.csatScore || 0), 0) / csatResponses.length * 10) / 10
    : 0;

  // Sentiment breakdown
  const sentimentBreakdown: Record<ResponseSentiment, number> = {
    [ResponseSentiment.POSITIVE]: 0,
    [ResponseSentiment.NEUTRAL]: 0,
    [ResponseSentiment.NEGATIVE]: 0,
  };
  for (const r of hotelResponses) {
    sentimentBreakdown[r.sentiment]++;
  }

  // Response trend (last 7 days)
  const responseTrend: Array<{ date: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const count = hotelResponses.filter(r => r.createdAt.toISOString().slice(0, 10) === dateStr).length;
    responseTrend.push({ date: dateStr, count });
  }

  return {
    totalResponses: hotelResponses.length,
    avgNPS,
    avgCSAT,
    promoters,
    passives,
    detractors,
    nps,
    sentimentBreakdown,
    responseTrend,
  };
}

// Reset function for testing
export function resetStore(): void {
  templates.clear();
  surveys.clear();
  responses.clear();
  alerts.clear();
}
