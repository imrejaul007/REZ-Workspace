/**
 * REZ Survey Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SurveyType,
  SurveyChannel,
  SurveyStatus,
  SurveyAlertSeverity,
  AlertType,
  AlertStatus,
  ResponseSentiment,
  resetStore,
  createTemplate,
  getTemplate,
  getTemplatesByHotel,
  getGlobalTemplates,
  createSurvey,
  getSurvey,
  getSurveysByHotel,
  activateSurvey,
  pauseSurvey,
  closeSurvey,
  submitResponse,
  getResponse,
  getResponsesByHotel,
  getResponsesBySurvey,
  createAlert,
  getAlert,
  getAlertsByHotel,
  acknowledgeAlert,
  resolveAlert,
  getSurveyAnalytics,
  getNPSCategory,
} from './services/survey.service.js';

describe('Survey Service', () => {
  beforeEach(() => {
    resetStore();
  });

  // ========================
  // TEMPLATE TESTS
  // ========================

  describe('Template Management', () => {
    it('should create a template', () => {
      const template = createTemplate(
        'NPS Survey',
        SurveyType.NPS,
        [
          { id: 'q1', type: 'nps', question: 'How likely are you to recommend us?', required: true },
        ]
      );

      expect(template).toBeDefined();
      expect(template.templateId).toMatch(/^TPL-[A-Z0-9]+$/);
      expect(template.name).toBe('NPS Survey');
      expect(template.type).toBe(SurveyType.NPS);
      expect(template.questions).toHaveLength(1);
      expect(template.isGlobal).toBe(true);
    });

    it('should create hotel-specific template', () => {
      const template = createTemplate(
        'Hotel NPS',
        SurveyType.NPS,
        [],
        'hotel-1'
      );

      expect(template.hotelId).toBe('hotel-1');
      expect(template.isGlobal).toBe(false);
    });

    it('should get template by ID', () => {
      const created = createTemplate('Test', SurveyType.CSAT, []);
      const found = getTemplate(created.templateId);

      expect(found?.templateId).toBe(created.templateId);
    });

    it('should get templates by hotel including globals', () => {
      createTemplate('Global', SurveyType.NPS, []);
      createTemplate('Hotel 1', SurveyType.CSAT, [], 'hotel-1');
      createTemplate('Hotel 2', SurveyType.CES, [], 'hotel-2');

      const hotel1Templates = getTemplatesByHotel('hotel-1');
      expect(hotel1Templates).toHaveLength(2); // Global + Hotel 1
    });

    it('should get global templates only', () => {
      createTemplate('Global 1', SurveyType.NPS, []);
      createTemplate('Global 2', SurveyType.CSAT, []);
      createTemplate('Hotel 1', SurveyType.CES, [], 'hotel-1');

      const globals = getGlobalTemplates();
      expect(globals).toHaveLength(2);
      expect(globals.every(t => t.isGlobal)).toBe(true);
    });

    it('should return undefined for non-existent template', () => {
      const found = getTemplate('non-existent');
      expect(found).toBeUndefined();
    });
  });

  // ========================
  // SURVEY TESTS
  // ========================

  describe('Survey Management', () => {
    let template: ReturnType<typeof createTemplate>;

    beforeEach(() => {
      template = createTemplate('Test', SurveyType.NPS, []);
    });

    it('should create a survey', () => {
      const survey = createSurvey(
        'hotel-1',
        template.templateId,
        'June NPS Survey',
        [SurveyChannel.EMAIL, SurveyChannel.SMS]
      );

      expect(survey).toBeDefined();
      expect(survey.surveyId).toMatch(/^SURV-[A-Z0-9]+$/);
      expect(survey.hotelId).toBe('hotel-1');
      expect(survey.templateId).toBe(template.templateId);
      expect(survey.status).toBe(SurveyStatus.DRAFT);
      expect(survey.isActive).toBe(false);
      expect(survey.channels).toContain(SurveyChannel.EMAIL);
      expect(survey.channels).toContain(SurveyChannel.SMS);
    });

    it('should get survey by ID', () => {
      const created = createSurvey('hotel-1', template.templateId, 'Test');
      const found = getSurvey(created.surveyId);

      expect(found?.surveyId).toBe(created.surveyId);
    });

    it('should get surveys by hotel', () => {
      createSurvey('hotel-1', template.templateId, 'Survey 1');
      createSurvey('hotel-1', template.templateId, 'Survey 2');
      createSurvey('hotel-2', template.templateId, 'Survey 3');

      const hotel1Surveys = getSurveysByHotel('hotel-1');
      expect(hotel1Surveys).toHaveLength(2);
    });

    it('should activate survey', () => {
      const survey = createSurvey('hotel-1', template.templateId, 'Test');
      const activated = activateSurvey(survey.surveyId);

      expect(activated?.status).toBe(SurveyStatus.ACTIVE);
      expect(activated?.isActive).toBe(true);
    });

    it('should pause survey', () => {
      const survey = createSurvey('hotel-1', template.templateId, 'Test');
      activateSurvey(survey.surveyId);
      const paused = pauseSurvey(survey.surveyId);

      expect(paused?.status).toBe(SurveyStatus.PAUSED);
      expect(paused?.isActive).toBe(false);
    });

    it('should close survey', () => {
      const survey = createSurvey('hotel-1', template.templateId, 'Test');
      const closed = closeSurvey(survey.surveyId);

      expect(closed?.status).toBe(SurveyStatus.CLOSED);
      expect(closed?.isActive).toBe(false);
    });
  });

  // ========================
  // RESPONSE TESTS
  // ========================

  describe('Response Management', () => {
    let survey: ReturnType<typeof createSurvey>;

    beforeEach(() => {
      const template = createTemplate('Test', SurveyType.NPS, []);
      survey = createSurvey('hotel-1', template.templateId, 'Test Survey');
    });

    it('should submit NPS response', () => {
      const response = submitResponse(
        survey.surveyId,
        'hotel-1',
        'guest-1',
        'booking-1',
        SurveyType.NPS,
        [{ questionId: 'q1', question: 'NPS?', score: 9, comment: 'Great service!' }],
        9
      );

      expect(response).toBeDefined();
      expect(response.responseId).toMatch(/^RESP-[A-Z0-9]+$/);
      expect(response.npsScore).toBe(9);
      expect(response.npsCategory).toBe('Promoter');
      expect(response.sentiment).toBe(ResponseSentiment.POSITIVE);
    });

    it('should submit CSAT response', () => {
      const response = submitResponse(
        survey.surveyId,
        'hotel-1',
        'guest-1',
        'booking-1',
        SurveyType.CSAT,
        [],
        undefined,
        4
      );

      expect(response.csatScore).toBe(4);
      expect(response.overallScore).toBe(8); // Scaled to 10
    });

    it('should detect negative sentiment from comments', () => {
      const response = submitResponse(
        survey.surveyId,
        'hotel-1',
        'guest-1',
        'booking-1',
        SurveyType.NPS,
        [{ questionId: 'q1', question: '?', score: 3, comment: 'Terrible experience. Dirty room, awful service.' }],
        3
      );

      expect(response.sentiment).toBe(ResponseSentiment.NEGATIVE);
      expect(response.sentimentScore).toBeLessThan(0);
    });

    it('should get responses by hotel', () => {
      submitResponse(survey.surveyId, 'hotel-1', 'g1', 'b1', SurveyType.NPS, [], 9);
      submitResponse(survey.surveyId, 'hotel-1', 'g2', 'b2', SurveyType.NPS, [], 8);
      submitResponse(survey.surveyId, 'hotel-2', 'g3', 'b3', SurveyType.NPS, [], 7);

      const hotel1Responses = getResponsesByHotel('hotel-1');
      expect(hotel1Responses).toHaveLength(2);
    });

    it('should get responses by survey', () => {
      const survey2 = createSurvey('hotel-1', survey.templateId, 'Test 2');

      submitResponse(survey.surveyId, 'hotel-1', 'g1', 'b1', SurveyType.NPS, [], 9);
      submitResponse(survey2.surveyId, 'hotel-1', 'g2', 'b2', SurveyType.NPS, [], 8);

      const survey1Responses = getResponsesBySurvey(survey.surveyId);
      expect(survey1Responses).toHaveLength(1);
    });
  });

  // ========================
  // ALERT TESTS
  // ========================

  describe('Alert Management', () => {
    it('should create detractor alert', () => {
      const alert = createAlert(
        'hotel-1',
        AlertType.DETRACTOR,
        SurveyAlertSeverity.WARNING,
        'Low NPS Score',
        'Guest gave NPS score of 5'
      );

      expect(alert).toBeDefined();
      expect(alert.alertId).toMatch(/^ALERT-[A-Z0-9]+$/);
      expect(alert.status).toBe(AlertStatus.NEW);
      expect(alert.severity).toBe(SurveyAlertSeverity.WARNING);
    });

    it('should get alerts by hotel', () => {
      createAlert('hotel-1', AlertType.LOW_NPS, SurveyAlertSeverity.INFO, 'Info', 'Msg');
      createAlert('hotel-1', AlertType.DETRACTOR, SurveyAlertSeverity.WARNING, 'Warn', 'Msg');
      createAlert('hotel-2', AlertType.DETRACTOR, SurveyAlertSeverity.CRITICAL, 'Critical', 'Msg');

      const hotel1Alerts = getAlertsByHotel('hotel-1');
      expect(hotel1Alerts).toHaveLength(2);
    });

    it('should filter alerts by status', () => {
      const alert = createAlert('hotel-1', AlertType.LOW_NPS, SurveyAlertSeverity.INFO, 'Alert', 'Msg');
      acknowledgeAlert(alert.alertId, 'manager-1');

      const newAlerts = getAlertsByHotel('hotel-1', AlertStatus.NEW);
      const ackAlerts = getAlertsByHotel('hotel-1', AlertStatus.ACKNOWLEDGED);

      expect(newAlerts).toHaveLength(0);
      expect(ackAlerts).toHaveLength(1);
    });

    it('should acknowledge alert', () => {
      const alert = createAlert('hotel-1', AlertType.LOW_NPS, SurveyAlertSeverity.INFO, 'Alert', 'Msg');
      const acknowledged = acknowledgeAlert(alert.alertId, 'manager-1');

      expect(acknowledged?.status).toBe(AlertStatus.ACKNOWLEDGED);
      expect(acknowledged?.acknowledgedBy).toBe('manager-1');
      expect(acknowledged?.acknowledgedAt).toBeInstanceOf(Date);
    });

    it('should resolve alert', () => {
      const alert = createAlert('hotel-1', AlertType.LOW_NPS, SurveyAlertSeverity.INFO, 'Alert', 'Msg');
      const resolved = resolveAlert(alert.alertId, 'manager-1');

      expect(resolved?.status).toBe(AlertStatus.RESOLVED);
      expect(resolved?.resolvedBy).toBe('manager-1');
      expect(resolved?.resolvedAt).toBeInstanceOf(Date);
    });

    it('should sort alerts by severity (critical first)', () => {
      createAlert('hotel-1', AlertType.LOW_NPS, SurveyAlertSeverity.INFO, 'Info', 'Msg');
      createAlert('hotel-1', AlertType.DETRACTOR, SurveyAlertSeverity.CRITICAL, 'Critical', 'Msg');
      createAlert('hotel-1', AlertType.URGENT_COMMENT, SurveyAlertSeverity.WARNING, 'Warning', 'Msg');

      const alerts = getAlertsByHotel('hotel-1');
      expect(alerts[0].severity).toBe(SurveyAlertSeverity.CRITICAL);
      expect(alerts[1].severity).toBe(SurveyAlertSeverity.WARNING);
      expect(alerts[2].severity).toBe(SurveyAlertSeverity.INFO);
    });
  });

  // ========================
  // ANALYTICS TESTS
  // ========================

  describe('Analytics', () => {
    it('should calculate NPS correctly', () => {
      const template = createTemplate('Test', SurveyType.NPS, []);
      const survey = createSurvey('hotel-1', template.templateId, 'Test');

      // 3 promoters (9-10), 2 passives (7-8), 2 detractors (0-6)
      submitResponse(survey.surveyId, 'hotel-1', 'g1', 'b1', SurveyType.NPS, [], 10);
      submitResponse(survey.surveyId, 'hotel-1', 'g2', 'b2', SurveyType.NPS, [], 9);
      submitResponse(survey.surveyId, 'hotel-1', 'g3', 'b3', SurveyType.NPS, [], 9);
      submitResponse(survey.surveyId, 'hotel-1', 'g4', 'b4', SurveyType.NPS, [], 8);
      submitResponse(survey.surveyId, 'hotel-1', 'g5', 'b5', SurveyType.NPS, [], 8);
      submitResponse(survey.surveyId, 'hotel-1', 'g6', 'b6', SurveyType.NPS, [], 5);
      submitResponse(survey.surveyId, 'hotel-1', 'g7', 'b7', SurveyType.NPS, [], 3);

      const analytics = getSurveyAnalytics('hotel-1');

      expect(analytics.totalResponses).toBe(7);
      expect(analytics.promoters).toBe(3);
      expect(analytics.passives).toBe(2);
      expect(analytics.detractors).toBe(2);
      // NPS = ((3 - 2) / 7) * 100 = 14.28... ≈ 14
      expect(analytics.nps).toBe(14);
    });

    it('should calculate CSAT average', () => {
      const template = createTemplate('Test', SurveyType.CSAT, []);
      const survey = createSurvey('hotel-1', template.templateId, 'Test');

      submitResponse(survey.surveyId, 'hotel-1', 'g1', 'b1', SurveyType.CSAT, [], undefined, 5);
      submitResponse(survey.surveyId, 'hotel-1', 'g2', 'b2', SurveyType.CSAT, [], undefined, 4);
      submitResponse(survey.surveyId, 'hotel-1', 'g3', 'b3', SurveyType.CSAT, [], undefined, 3);

      const analytics = getSurveyAnalytics('hotel-1');

      expect(analytics.avgCSAT).toBe(4); // (5+4+3)/3 = 4
    });

    it('should calculate sentiment breakdown', () => {
      const template = createTemplate('Test', SurveyType.NPS, []);
      const survey = createSurvey('hotel-1', template.templateId, 'Test');

      submitResponse(survey.surveyId, 'hotel-1', 'g1', 'b1', SurveyType.NPS, [{ questionId: 'q1', question: '?', comment: 'Excellent service!' }], 9);
      submitResponse(survey.surveyId, 'hotel-1', 'g2', 'b2', SurveyType.NPS, [{ questionId: 'q1', question: '?', comment: 'Okay experience.' }], 5);
      submitResponse(survey.surveyId, 'hotel-1', 'g3', 'b3', SurveyType.NPS, [{ questionId: 'q1', question: '?', comment: 'Terrible stay.' }], 2);

      const analytics = getSurveyAnalytics('hotel-1');

      expect(analytics.sentimentBreakdown[ResponseSentiment.POSITIVE]).toBe(1);
      expect(analytics.sentimentBreakdown[ResponseSentiment.NEUTRAL]).toBe(1);
      expect(analytics.sentimentBreakdown[ResponseSentiment.NEGATIVE]).toBe(1);
    });

    it('should handle empty hotel analytics', () => {
      const analytics = getSurveyAnalytics('empty-hotel');

      expect(analytics.totalResponses).toBe(0);
      expect(analytics.nps).toBe(0);
      expect(analytics.avgCSAT).toBe(0);
    });
  });

  // ========================
  // NPS CATEGORY TESTS
  // ========================

  describe('NPS Category', () => {
    it('should categorize promoters (9-10)', () => {
      expect(getNPSCategory(9)).toBe('Promoter');
      expect(getNPSCategory(10)).toBe('Promoter');
    });

    it('should categorize passives (7-8)', () => {
      expect(getNPSCategory(7)).toBe('Passive');
      expect(getNPSCategory(8)).toBe('Passive');
    });

    it('should categorize detractors (0-6)', () => {
      expect(getNPSCategory(0)).toBe('Detractor');
      expect(getNPSCategory(6)).toBe('Detractor');
    });
  });

  // ========================
  // EDGE CASES
  // ========================

  describe('Edge Cases', () => {
    it('should handle all survey types', () => {
      const types = Object.values(SurveyType);

      for (const type of types) {
        const template = createTemplate(`Template ${type}`, type, []);
        expect(template.type).toBe(type);
      }
    });

    it('should handle all channels', () => {
      const channels = Object.values(SurveyChannel);

      for (const channel of channels) {
        const template = createTemplate('Test', SurveyType.NPS, []);
        const survey = createSurvey('hotel-1', template.templateId, 'Test', [channel]);
        expect(survey.channels).toContain(channel);
      }
    });

    it('should handle all survey statuses', () => {
      const template = createTemplate('Test', SurveyType.NPS, []);
      const survey = createSurvey('hotel-1', template.templateId, 'Test');

      expect(survey.status).toBe(SurveyStatus.DRAFT);

      activateSurvey(survey.surveyId);
      expect(getSurvey(survey.surveyId)?.status).toBe(SurveyStatus.ACTIVE);

      pauseSurvey(survey.surveyId);
      expect(getSurvey(survey.surveyId)?.status).toBe(SurveyStatus.PAUSED);

      closeSurvey(survey.surveyId);
      expect(getSurvey(survey.surveyId)?.status).toBe(SurveyStatus.CLOSED);
    });

    it('should handle survey without responses', () => {
      const template = createTemplate('Test', SurveyType.NPS, []);
      createSurvey('hotel-1', template.templateId, 'Empty Survey');

      const responses = getResponsesByHotel('hotel-1');
      expect(responses).toHaveLength(0);
    });

    it('should handle all alert types', () => {
      const types = Object.values(AlertType);

      for (const type of types) {
        const alert = createAlert('hotel-1', type, SurveyAlertSeverity.INFO, 'Test', 'Test');
        expect(alert.type).toBe(type);
      }
    });
  });
});
