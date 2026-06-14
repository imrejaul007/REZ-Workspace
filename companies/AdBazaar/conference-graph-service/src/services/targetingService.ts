import { Conference, Speaker, Session, ConferenceAnalytics } from '../models';
import { AdTargetingCriteria } from '../types';
import { logger, cacheGet, cacheSet, CACHE_TTL, dbOperationDuration } from '../utils';
import { targetingQueries } from '../utils/metrics';

export interface TargetingResult {
  conferences: Array<{
    conferenceId: string;
    name: string;
    industry: string;
    date: { start: Date; end: Date };
    venue: { city: string; country: string };
    topics: string[];
    expectedAttendance: number;
    matchScore: number;
    impressions: number;
    impressionsPerDay: number;
    audienceReach: number;
  }>;
  speakers: Array<{
    speakerId: string;
    name: string;
    company: string;
    topic: string;
    expertise: string[];
    followers: { linkedin: number; twitter: number };
    matchScore: number;
  }>;
  sessions: Array<{
    sessionId: string;
    title: string;
    type: string;
    level: string;
    speakers: string[];
    matchScore: number;
    expectedAttendance: number;
  }>;
  targetingMetadata: {
    totalMatches: number;
    estimatedReach: number;
    avgImpressionsPerDay: number;
    topIndustries: string[];
    topTopics: string[];
    recommendedBidMultiplier: number;
  };
}

export class TargetingService {
  /**
   * Get ad targeting data for conferences
   */
  async getTargetingData(criteria: AdTargetingCriteria): Promise<TargetingResult> {
    const startTimer = dbOperationDuration.startTimer({ operation: 'query', collection: 'targeting' });
    targetingQueries.inc({ industry: criteria.industry || 'all' });

    const cacheKey = `targeting:${JSON.stringify(criteria)}`;

    try {
      const cached = await cacheGet(cacheKey, 'targeting');
      if (cached) {
        return JSON.parse(cached);
      }

      // Build conference query
      const conferenceQuery: Record<string, unknown> = {
        status: { $in: ['published', 'ongoing'] }
      };

      if (criteria.industry) {
        conferenceQuery.industry = criteria.industry;
      }

      if (criteria.topics && criteria.topics.length > 0) {
        conferenceQuery.topics = { $in: criteria.topics };
      }

      if (criteria.audience && criteria.audience.length > 0) {
        conferenceQuery.targetAudience = { $in: criteria.audience };
      }

      if (criteria.location) {
        conferenceQuery.$or = [
          { 'venue.city': { $regex: criteria.location, $options: 'i' } },
          { 'venue.country': { $regex: criteria.location, $options: 'i' } }
        ];
      }

      if (criteria.dateRange) {
        conferenceQuery['date.start'] = {
          $gte: new Date(criteria.dateRange.start),
          $lte: new Date(criteria.dateRange.end)
        };
      }

      // Get conferences
      const conferences = await Conference.find(conferenceQuery)
        .sort({ 'date.start': 1 })
        .lean();

      // Get analytics for all conferences
      const conferenceIds = conferences.map(c => c._id);
      const analytics = await ConferenceAnalytics.find({
        conferenceId: { $in: conferenceIds }
      }).lean();

      // Calculate match scores and build result
      const targetedConferences = conferences.map(conf => {
        const confAnalytics = analytics.find(
          a => a.conferenceId.toString() === conf._id.toString()
        );

        const matchScore = this.calculateConferenceMatchScore(conf, criteria);

        // Calculate impressions per day
        const daysUntilStart = Math.max(1, Math.ceil(
          (new Date(conf.date.start).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ));
        const impressions = confAnalytics?.impressions || 0;
        const impressionsPerDay = impressions / daysUntilStart;

        return {
          conferenceId: conf._id.toString(),
          name: conf.name,
          industry: conf.industry,
          date: conf.date,
          venue: conf.venue,
          topics: conf.topics,
          expectedAttendance: conf.expectedAttendance,
          matchScore,
          impressions,
          impressionsPerDay: Math.round(impressionsPerDay * 10) / 10,
          audienceReach: confAnalytics?.registrations || 0
        };
      }).sort((a, b) => b.matchScore - a.matchScore);

      // Get speakers based on criteria
      const speakerQuery: Record<string, unknown> = {};

      if (criteria.speakerInfluence?.minFollowers) {
        speakerQuery['followers.linkedin'] = { $gte: criteria.speakerInfluence.minFollowers };
      }

      if (criteria.speakerInfluence?.minRating) {
        speakerQuery.rating = { $gte: criteria.speakerInfluence.minRating };
      }

      const speakers = await Speaker.find(speakerQuery)
        .populate('conferenceId')
        .lean();

      const targetedSpeakers = speakers
        .map(speaker => {
          const matchScore = this.calculateSpeakerMatchScore(speaker, criteria);
          return {
            speakerId: speaker._id.toString(),
            name: speaker.name,
            company: speaker.company,
            topic: speaker.topic,
            expertise: speaker.expertise,
            followers: {
              linkedin: speaker.followers?.linkedin || 0,
              twitter: speaker.followers?.twitter || 0
            },
            matchScore
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 50);

      // Get sessions
      const sessionQuery: Record<string, unknown> = {
        conferenceId: { $in: conferenceIds }
      };

      if (criteria.topics && criteria.topics.length > 0) {
        sessionQuery.tags = { $in: criteria.topics };
      }

      const sessions = await Session.find(sessionQuery)
        .populate('speakerIds', 'name')
        .lean();

      const targetedSessions = sessions.map(session => {
        const matchScore = this.calculateSessionMatchScore(session, criteria);
        return {
          sessionId: session._id.toString(),
          title: session.title,
          type: session.type,
          level: session.level,
          speakers: (session.speakerIds as unknown as Array<{ name: string }>).map(s => s.name),
          matchScore,
          expectedAttendance: session.capacity || 0
        };
      }).sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 50);

      // Calculate metadata
      const totalImpressions = targetedConferences.reduce((sum, c) => sum + c.impressions, 0);
      const avgImpressionsPerDay = targetedConferences.length > 0
        ? targetedConferences.reduce((sum, c) => sum + c.impressionsPerDay, 0) / targetedConferences.length
        : 0;

      const industryCount: Record<string, number> = {};
      const topicCount: Record<string, number> = {};

      targetedConferences.forEach(c => {
        industryCount[c.industry] = (industryCount[c.industry] || 0) + 1;
        c.topics.forEach(t => {
          topicCount[t] = (topicCount[t] || 0) + 1;
        });
      });

      const topIndustries = Object.entries(industryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      const topTopics = Object.entries(topicCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name]) => name);

      // Calculate recommended bid multiplier based on competition
      const highCompetition = avgImpressionsPerDay > 1000;
      const recommendedBidMultiplier = highCompetition ? 1.5 : 1.0;

      const result: TargetingResult = {
        conferences: targetedConferences,
        speakers: targetedSpeakers,
        sessions: targetedSessions,
        targetingMetadata: {
          totalMatches: targetedConferences.length + targetedSpeakers.length + targetedSessions.length,
          estimatedReach: targetedConferences.reduce((sum, c) => sum + c.expectedAttendance, 0),
          avgImpressionsPerDay: Math.round(avgImpressionsPerDay * 10) / 10,
          topIndustries,
          topTopics,
          recommendedBidMultiplier
        }
      };

      await cacheSet(cacheKey, JSON.stringify(result), CACHE_TTL.TARGETING);

      return result;
    } catch (error) {
      logger.error('Error getting targeting data', { criteria, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      startTimer();
    }
  }

  /**
   * Calculate conference match score based on targeting criteria
   */
  private calculateConferenceMatchScore(
    conference: Record<string, unknown>,
    criteria: AdTargetingCriteria
  ): number {
    let score = 0;
    let maxScore = 0;

    // Industry match (30 points)
    maxScore += 30;
    if (criteria.industry && conference.industry === criteria.industry) {
      score += 30;
    }

    // Topics match (25 points)
    maxScore += 25;
    if (criteria.topics && criteria.topics.length > 0) {
      const confTopics = conference.topics as string[];
      const matchingTopics = confTopics.filter(t =>
        criteria.topics!.some(criteriaTopic =>
          t.toLowerCase().includes(criteriaTopic.toLowerCase())
        )
      );
      score += (matchingTopics.length / criteria.topics.length) * 25;
    }

    // Audience match (25 points)
    maxScore += 25;
    if (criteria.audience && criteria.audience.length > 0) {
      const targetAudience = conference.targetAudience as string[];
      const matchingAudience = targetAudience.filter(a =>
        criteria.audience!.some(criteriaAudience =>
          a.toLowerCase().includes(criteriaAudience.toLowerCase())
        )
      );
      score += (matchingAudience.length / criteria.audience.length) * 25;
    }

    // Location match (20 points)
    maxScore += 20;
    if (criteria.location) {
      const venue = conference.venue as { city: string; country: string };
      if (
        venue.city.toLowerCase().includes(criteria.location.toLowerCase()) ||
        venue.country.toLowerCase().includes(criteria.location.toLowerCase())
      ) {
        score += 20;
      }
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  /**
   * Calculate speaker match score based on targeting criteria
   */
  private calculateSpeakerMatchScore(
    speaker: Record<string, unknown>,
    criteria: AdTargetingCriteria
  ): number {
    let score = 0;
    let maxScore = 0;

    // Topic match (40 points)
    maxScore += 40;
    if (criteria.topics && criteria.topics.length > 0) {
      const speakerExpertise = speaker.expertise as string[];
      const speakerTopic = (speaker.topic as string || '').toLowerCase();

      const matchingExpertise = speakerExpertise.filter(e =>
        criteria.topics!.some(t =>
          e.toLowerCase().includes(t.toLowerCase())
        )
      );

      let topicScore = 0;
      if (matchingExpertise.length > 0) {
        topicScore += 20;
      }
      if (criteria.topics.some(t => speakerTopic.includes(t.toLowerCase()))) {
        topicScore += 20;
      }
      score += topicScore;
    }

    // Influence score (30 points)
    maxScore += 30;
    const followers = speaker.followers as { linkedin?: number; twitter?: number } || {};
    const totalFollowers = (followers.linkedin || 0) + (followers.twitter || 0);

    if (criteria.speakerInfluence?.minFollowers) {
      if (totalFollowers >= criteria.speakerInfluence.minFollowers) {
        score += 30;
      } else {
        score += (totalFollowers / criteria.speakerInfluence.minFollowers) * 30;
      }
    } else {
      // Default: higher followers = higher score
      score += Math.min(30, totalFollowers / 1000);
    }

    // Rating score (30 points)
    maxScore += 30;
    const rating = (speaker.rating as number) || 0;
    if (criteria.speakerInfluence?.minRating) {
      if (rating >= criteria.speakerInfluence.minRating) {
        score += 30;
      } else {
        score += (rating / criteria.speakerInfluence.minRating) * 30;
      }
    } else {
      score += rating * 6; // Assuming rating is 0-5
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  /**
   * Calculate session match score based on targeting criteria
   */
  private calculateSessionMatchScore(
    session: Record<string, unknown>,
    criteria: AdTargetingCriteria
  ): number {
    let score = 0;
    let maxScore = 0;

    // Tag match (40 points)
    maxScore += 40;
    if (criteria.topics && criteria.topics.length > 0) {
      const sessionTags = session.tags as string[];
      const matchingTags = sessionTags.filter(t =>
        criteria.topics!.some(criteriaTopic =>
          t.toLowerCase().includes(criteriaTopic.toLowerCase())
        )
      );
      score += (matchingTags.length / criteria.topics.length) * 40;
    }

    // Level match (30 points) - any level matches
    maxScore += 30;
    score += 30; // All levels are equally valuable for targeting

    // Popularity (30 points)
    maxScore += 30;
    const registeredCount = (session.registeredCount as number) || 0;
    const capacity = (session.capacity as number) || 100;
    const occupancyRate = registeredCount / capacity;

    if (occupancyRate > 0.8) {
      score += 30;
    } else if (occupancyRate > 0.5) {
      score += 20;
    } else {
      score += 10;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  /**
   * Get estimated reach for targeting criteria
   */
  async getEstimatedReach(criteria: AdTargetingCriteria): Promise<{
    estimatedReach: number;
    estimatedImpressions: number;
    estimatedRegistrations: number;
    confidence: 'high' | 'medium' | 'low';
  }> {
    try {
      const targetingData = await this.getTargetingData(criteria);

      const estimatedReach = targetingData.targetingMetadata.estimatedReach;
      const estimatedImpressions = estimatedReach * 10; // Assume 10 impressions per attendee
      const estimatedRegistrations = Math.round(estimatedImpressions * 0.05); // 5% conversion

      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (targetingData.conferences.length > 10 && targetingData.speakers.length > 20) {
        confidence = 'high';
      } else if (targetingData.conferences.length > 5 && targetingData.speakers.length > 10) {
        confidence = 'medium';
      }

      return {
        estimatedReach,
        estimatedImpressions,
        estimatedRegistrations,
        confidence
      };
    } catch (error) {
      logger.error('Error estimating reach', { criteria, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
}

export const targetingService = new TargetingService();
