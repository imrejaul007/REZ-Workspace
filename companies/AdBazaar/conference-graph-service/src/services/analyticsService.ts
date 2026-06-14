import { ConferenceAnalytics, IConferenceAnalyticsDocument, Conference, Session } from '../models';
import { logger, cacheGet, cacheSet, CACHE_TTL, dbOperationDuration } from '../utils';
import { analyticsQueries, registrationsTotal } from '../utils/metrics';

export class AnalyticsService {
  /**
   * Get or create analytics for a conference
   */
  async getOrCreateAnalytics(conferenceId: string): Promise<IConferenceAnalyticsDocument> {
    let analytics = await ConferenceAnalytics.findOne({ conferenceId }).lean();

    if (!analytics) {
      analytics = await this.initializeAnalytics(conferenceId);
    }

    return analytics as IConferenceAnalyticsDocument;
  }

  /**
   * Initialize analytics for a conference
   */
  private async initializeAnalytics(conferenceId: string): Promise<IConferenceAnalyticsDocument> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'insert', collection: 'conference_analytics' });

    try {
      // Get all sessions for this conference
      const sessions = await Session.find({ conferenceId }).lean();

      const sessionAnalytics = sessions.map(session => ({
        sessionId: session._id,
        impressions: 0,
        attendance: 0,
        feedback: {
          rating: session.feedback?.rating || 0,
          count: session.feedback?.count || 0
        }
      }));

      const analytics = new ConferenceAnalytics({
        conferenceId,
        impressions: 0,
        registrations: 0,
        attendance: 0,
        checkIns: 0,
        sessions: sessionAnalytics,
        engagement: {
          websiteVisits: 0,
          socialShares: 0,
          hashtagMentions: 0,
          pressMentions: 0
        },
        conversions: {
          registrations: 0,
          ticketSales: 0,
          sponsorMeetings: 0,
          leadCaptures: 0
        },
        demographics: {
          industries: {},
          jobTitles: {},
          companySizes: {},
          countries: {}
        }
      });

      await analytics.save();

      logger.info('Conference analytics initialized', { conferenceId });

      return analytics;
    } finally {
      startTimer();
    }
  }

  /**
   * Get conference analytics
   */
  async getAnalytics(conferenceId: string): Promise<{
    analytics: IConferenceAnalyticsDocument;
    conference: Record<string, unknown>;
    sessions: Record<string, unknown>[];
    summary: {
      totalSessions: number;
      totalSpeakers: number;
      avgSessionRating: number;
      occupancyRate: number;
    };
  }> {
    analyticsQueries.inc({ type: 'get_analytics' });
    const cacheKey = `analytics:conference:${conferenceId}`;

    try {
      const cached = await cacheGet(cacheKey, 'analytics');
      if (cached) {
        return JSON.parse(cached);
      }

      const [analytics, conference, sessions] = await Promise.all([
        this.getOrCreateAnalytics(conferenceId),
        Conference.findById(conferenceId).lean(),
        Session.find({ conferenceId })
          .populate('speakerIds')
          .lean()
      ]);

      // Calculate summary
      const totalSessions = sessions.length;
      const totalSpeakers = new Set(sessions.flatMap(s => s.speakerIds.map((sp: unknown) => (sp as { _id: unknown })._id))).size;

      const sessionsWithRatings = sessions.filter(s => (s.feedback as { rating: number })?.rating > 0);
      const avgSessionRating = sessionsWithRatings.length > 0
        ? sessionsWithRatings.reduce((sum, s) => sum + (s.feedback as { rating: number }).rating, 0) / sessionsWithRatings.length
        : 0;

      const occupancyRate = sessions.reduce((sum, s) => {
        if (s.capacity && s.capacity > 0) {
          return sum + ((s.registeredCount || 0) / s.capacity);
        }
        return sum;
      }, 0) / (sessions.filter(s => s.capacity).length || 1);

      const result = {
        analytics,
        conference,
        sessions,
        summary: {
          totalSessions,
          totalSpeakers,
          avgSessionRating: Math.round(avgSessionRating * 100) / 100,
          occupancyRate: Math.round(occupancyRate * 100)
        }
      };

      await cacheSet(cacheKey, JSON.stringify(result), CACHE_TTL.ANALYTICS);

      return result;
    } catch (error) {
      logger.error('Error getting conference analytics', { conferenceId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Record impression
   */
  async recordImpression(conferenceId: string, count: number = 1): Promise<void> {
    try {
      await ConferenceAnalytics.findOneAndUpdate(
        { conferenceId },
        { $inc: { impressions: count } }
      );
    } catch (error) {
      logger.error('Error recording impression', { conferenceId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Record registration
   */
  async recordRegistration(conferenceId: string): Promise<void> {
    try {
      await ConferenceAnalytics.findOneAndUpdate(
        { conferenceId },
        { $inc: { registrations: 1, 'conversions.registrations': 1 } }
      );

      registrationsTotal.inc({ conference_id: conferenceId });
    } catch (error) {
      logger.error('Error recording registration', { conferenceId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Record attendance/check-in
   */
  async recordCheckIn(conferenceId: string): Promise<void> {
    try {
      await ConferenceAnalytics.findOneAndUpdate(
        { conferenceId },
        { $inc: { attendance: 1, checkIns: 1 } }
      );
    } catch (error) {
      logger.error('Error recording check-in', { conferenceId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Record session attendance
   */
  async recordSessionAttendance(conferenceId: string, sessionId: string): Promise<void> {
    try {
      await ConferenceAnalytics.findOneAndUpdate(
        { conferenceId, 'sessions.sessionId': sessionId },
        { $inc: { 'sessions.$.attendance': 1 } }
      );
    } catch (error) {
      logger.error('Error recording session attendance', { conferenceId, sessionId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Record engagement metric
   */
  async recordEngagement(conferenceId: string, metric: string, count: number = 1): Promise<void> {
    try {
      const updateField: Record<string, number> = {};
      const metricMap: Record<string, string> = {
        websiteVisits: 'engagement.websiteVisits',
        socialShares: 'engagement.socialShares',
        hashtagMentions: 'engagement.hashtagMentions',
        pressMentions: 'engagement.pressMentions'
      };

      const field = metricMap[metric];
      if (field) {
        updateField[field] = count;
        await ConferenceAnalytics.findOneAndUpdate(
          { conferenceId },
          { $inc: updateField }
        );
      }
    } catch (error) {
      logger.error('Error recording engagement', { conferenceId, metric, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Record conversion
   */
  async recordConversion(conferenceId: string, type: string, count: number = 1): Promise<void> {
    try {
      const updateField: Record<string, number> = {};
      const metricMap: Record<string, string> = {
        ticketSales: 'conversions.ticketSales',
        sponsorMeetings: 'conversions.sponsorMeetings',
        leadCaptures: 'conversions.leadCaptures'
      };

      const field = metricMap[type];
      if (field) {
        updateField[field] = count;
        await ConferenceAnalytics.findOneAndUpdate(
          { conferenceId },
          { $inc: updateField }
        );
      }
    } catch (error) {
      logger.error('Error recording conversion', { conferenceId, type, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Update demographics
   */
  async updateDemographics(conferenceId: string, demographics: {
    industry?: string;
    jobTitle?: string;
    companySize?: string;
    country?: string;
  }): Promise<void> {
    try {
      const updates: Record<string, unknown> = {};

      if (demographics.industry) {
        updates['demographics.industries.' + demographics.industry] = 1;
      }
      if (demographics.jobTitle) {
        updates['demographics.jobTitles.' + demographics.jobTitle] = 1;
      }
      if (demographics.companySize) {
        updates['demographics.companySizes.' + demographics.companySize] = 1;
      }
      if (demographics.country) {
        updates['demographics.countries.' + demographics.country] = 1;
      }

      if (Object.keys(updates).length > 0) {
        await ConferenceAnalytics.findOneAndUpdate(
          { conferenceId },
          { $inc: updates }
        );
      }
    } catch (error) {
      logger.error('Error updating demographics', { conferenceId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get cross-conference analytics
   */
  async getCrossConferenceAnalytics(industry?: string): Promise<{
    totalConferences: number;
    totalImpressions: number;
    totalRegistrations: number;
    totalAttendance: number;
    avgConversionRate: number;
    topPerformingConferences: Array<{
      conferenceId: string;
      name: string;
      impressions: number;
      conversions: number;
      conversionRate: number;
    }>;
  }> {
    analyticsQueries.inc({ type: 'cross_conference' });

    try {
      const conferenceFilter = industry ? { industry } : {};
      const conferences = await Conference.find(conferenceFilter).lean();
      const conferenceIds = conferences.map(c => c._id);

      const analytics = await ConferenceAnalytics.find({
        conferenceId: { $in: conferenceIds }
      }).lean();

      const totalImpressions = analytics.reduce((sum, a) => sum + a.impressions, 0);
      const totalRegistrations = analytics.reduce((sum, a) => sum + a.registrations, 0);
      const totalAttendance = analytics.reduce((sum, a) => sum + a.attendance, 0);
      const avgConversionRate = totalImpressions > 0
        ? Math.round((totalRegistrations / totalImpressions) * 10000) / 100
        : 0;

      const topPerforming = conferences
        .map(c => {
          const a = analytics.find(an => an.conferenceId.toString() === c._id.toString());
          return {
            conferenceId: c._id.toString(),
            name: c.name,
            impressions: a?.impressions || 0,
            conversions: a?.registrations || 0,
            conversionRate: a && a.impressions > 0
              ? Math.round((a.registrations / a.impressions) * 10000) / 100
              : 0
          };
        })
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10);

      return {
        totalConferences: conferences.length,
        totalImpressions,
        totalRegistrations,
        totalAttendance,
        avgConversionRate,
        topPerformingConferences: topPerforming
      };
    } catch (error) {
      logger.error('Error getting cross-conference analytics', { industry, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
