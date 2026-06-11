/**
 * PROPFLOW - Intent Detection Tool
 * Tool for detecting buyer intent and urgency
 */

import { BaseTool } from '@hojai/agent-runtime';
import { AgentContext, ToolResult } from '@hojai/agent-runtime';

export class IntentDetectionTool extends BaseTool {
  name = 'intentDetection';
  description = 'Detect buyer intent level and urgency based on their actions and engagement';

  parameters = [
    {
      name: 'visitCount',
      type: 'number',
      description: 'Number of site visits completed',
      required: true
    },
    {
      name: 'daysSinceLastContact',
      type: 'number',
      description: 'Days since last contact with the lead',
      required: true
    },
    {
      name: 'propertyInterests',
      type: 'number',
      description: 'Number of properties the lead has shown interest in',
      required: false
    },
    {
      name: 'hasFinancing',
      type: 'boolean',
      description: 'Whether the lead has arranged financing',
      required: false
    },
    {
      name: 'status',
      type: 'string',
      description: 'Current lead status in pipeline',
      required: false,
      enum: ['new', 'contacted', 'qualified', 'visiting', 'negotiating', 'closed-won', 'closed-lost']
    }
  ];

  async execute(params: Record<string, any>, context: AgentContext): Promise<ToolResult> {
    try {
      const { visitCount, daysSinceLastContact, propertyInterests, hasFinancing, status } = params;

      let intentScore = 50;
      const indicators: string[] = [];
      const warnings: string[] = [];

      // Visit-based scoring
      if (visitCount >= 3) {
        intentScore += 25;
        indicators.push('Multiple site visits - high engagement');
      } else if (visitCount >= 1) {
        intentScore += 15;
        indicators.push('Has visited at least one property');
      } else {
        intentScore -= 5;
        warnings.push('No site visits yet');
      }

      // Recency-based scoring
      if (daysSinceLastContact <= 1) {
        intentScore += 20;
        indicators.push('Recent contact - active interest');
      } else if (daysSinceLastContact <= 7) {
        intentScore += 10;
        indicators.push('Contacted within last week');
      } else if (daysSinceLastContact <= 14) {
        intentScore += 5;
      } else if (daysSinceLastContact <= 30) {
        intentScore -= 5;
        warnings.push('No contact in 2-4 weeks');
      } else {
        intentScore -= 15;
        warnings.push('No contact in over a month');
      }

      // Property interest-based scoring
      if (propertyInterests && propertyInterests >= 5) {
        intentScore += 15;
        indicators.push('Strong property interest shown');
      } else if (propertyInterests && propertyInterests >= 2) {
        intentScore += 8;
        indicators.push('Multiple properties of interest');
      }

      // Financing-based scoring
      if (hasFinancing) {
        intentScore += 15;
        indicators.push('Financing arranged - serious buyer');
      }

      // Status-based scoring
      const statusScores: Record<string, number> = {
        'negotiating': 20,
        'visiting': 15,
        'qualified': 10,
        'contacted': 5,
        'new': 0
      };
      if (status && statusScores[status]) {
        intentScore += statusScores[status];
      }

      // Determine intent level
      let intentLevel: 'hot' | 'warm' | 'cold';
      if (intentScore >= 75) {
        intentLevel = 'hot';
      } else if (intentScore >= 50) {
        intentLevel = 'warm';
      } else {
        intentLevel = 'cold';
      }

      // Generate timeline estimate
      let estimatedTimeline: string;
      if (intentLevel === 'hot') {
        estimatedTimeline = "1-2 weeks";
      } else if (intentLevel === 'warm') {
        estimatedTimeline = "1-3 months";
      } else {
        estimatedTimeline = "3-6 months";
      }

      return {
        result: {
          intentScore: Math.min(100, Math.max(0, intentScore)),
          intentLevel,
          indicators,
          warnings,
          estimatedTimeline,
          recommendations: this.getRecommendations(intentLevel, indicators, warnings)
        }
      };
    } catch (error) {
      return {
        result: null,
        error: `Intent detection failed: ${error}`
      };
    }
  }

  private getRecommendations(level: string, indicators: string[], warnings: string[]): string[] {
    const recommendations: string[] = [];

    if (level === 'hot') {
      recommendations.push('Prioritize this lead - high conversion probability');
      recommendations.push('Schedule follow-up within 24 hours');
      recommendations.push('Prepare offer documents');
    } else if (level === 'warm') {
      recommendations.push('Schedule site visit to convert to hot');
      recommendations.push('Share matching property listings');
      recommendations.push('Follow up within 48-72 hours');
    } else {
      recommendations.push('Add to nurture campaign');
      recommendations.push('Share market updates and new listings');
      recommendations.push('Re-engage after 2 weeks');
    }

    if (warnings.includes('No site visits yet')) {
      recommendations.push('Encourage first site visit');
    }

    if (warnings.includes('No contact in over a month')) {
      recommendations.push('Send re-engagement message');
    }

    return recommendations;
  }
}

export default new IntentDetectionTool();