/**
 * Business Copilot → TwinOS Hub Connection
 * Enables end-to-end flow: Question → Twin → Memory → Intelligence → Answer
 */

import fetch from 'node-fetch';

const TWINOS_HUB_URL = process.env.TWINOS_HUB_URL || 'http://localhost:4000';
const GENIE_MEMORY_URL = process.env.GENIE_MEMORY_URL || 'http://localhost:5001';
const NEXHA_INTELLIGENCE_URL = process.env.NEXHA_INTELLIGENCE_URL || 'http://localhost:4350';

/**
 * Enhanced Copilot Engine with TwinOS integration
 */
export class BusinessCopilotWithTwins {
  constructor(config = {}) {
    this.skillRegistry = config.skillRegistry;
    this.logger = config.logger;
  }

  /**
   * Process message with cross-system intelligence
   */
  async process({ message, industry, context }) {
    const startTime = Date.now();

    // 1. Find relevant skills
    const relevantSkills = this._findRelevantSkills(message, industry);

    // 2. Query TwinOS Hub for relevant twin data
    const twinData = await this._queryTwins(message, industry, context);

    // 3. Query Genie Memory for context
    const memoryData = await this._queryMemory(message, context);

    // 4. Query domain-specific intelligence (Nexha, etc.)
    const intelligence = await this._queryIntelligence(message, industry, context);

    // 5. Generate enhanced response
    const response = await this._generateEnhancedResponse({
      message,
      industry,
      context,
      skills: relevantSkills,
      twinData,
      memoryData,
      intelligence
    });

    // 6. Generate suggestions
    const suggestions = this._generateSuggestions(relevantSkills, message, twinData);

    return {
      content: response,
      skills: relevantSkills.map(s => s.name),
      suggestions,
      sources: this._getActiveSources(twinData, memoryData, intelligence),
      twinData,
      memoryData,
      intelligence,
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Query TwinOS Hub for relevant twins
   */
  async _queryTwins(message, industry, context) {
    try {
      const response = await fetch(`${TWINOS_HUB_URL}/twins/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          industry: industry || context?.industry,
          limit: 5
        })
      });

      if (!response.ok) {
        this.logger?.warn('TwinOS Hub query failed');
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger?.warn('TwinOS Hub unavailable:', error.message);
      return null;
    }
  }

  /**
   * Query Genie Memory for context
   */
  async _queryMemory(message, context) {
    try {
      const response = await fetch(`${GENIE_MEMORY_URL}/memory/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          userId: context?.userId,
          limit: 3
        })
      });

      if (!response.ok) {
        this.logger?.warn('Genie Memory query failed');
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger?.warn('Genie Memory unavailable:', error.message);
      return null;
    }
  }

  /**
   * Query domain-specific intelligence
   */
  async _queryIntelligence(message, industry, context) {
    try {
      const response = await fetch(`${NEXHA_INTELLIGENCE_URL}/api/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          industry,
          context
        })
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger?.warn('Nexha Intelligence unavailable:', error.message);
      return null;
    }
  }

  /**
   * Generate enhanced response with cross-system data
   */
  async _generateEnhancedResponse({ message, industry, context, skills, twinData, memoryData, intelligence }) {
    // Build context from all sources
    const contextParts = [];

    if (twinData?.twins?.length > 0) {
      contextParts.push(`Based on ${twinData.twins.length} relevant digital twins:`);
      twinData.twins.slice(0, 3).forEach(twin => {
        contextParts.push(`- ${twin.name}: ${twin.description}`);
      });
    }

    if (memoryData?.items?.length > 0) {
      contextParts.push(`\nFrom memory: ${memoryData.items[0]?.content || 'Previous context found'}`);
    }

    if (intelligence?.insights?.length > 0) {
      contextParts.push(`\nIntelligence insights: ${intelligence.insights[0]}`);
    }

    const skill = skills[0];

    if (!skill) {
      return `I'm your ${industry} Business Copilot. How can I help you today?`;
    }

    // Construct enhanced response
    let response = `Based on your request about "${message}", I can help with ${skill.name}.\n\n`;
    response += `${skill.description}\n\n`;

    if (contextParts.length > 0) {
      response += `**Context from connected systems:**\n${contextParts.join('\n')}\n\n`;
    }

    response += `What specific action would you like me to take?`;

    return response;
  }

  /**
   * Generate suggestions based on twins and skills
   */
  _generateSuggestions(skills, message, twinData) {
    const suggestions = [];

    // Add skill-based suggestions
    for (const skill of skills.slice(0, 3)) {
      for (const prompt of skill.prompts.slice(0, 2)) {
        suggestions.push(prompt);
      }
    }

    // Add twin-based suggestions if available
    if (twinData?.twins?.length > 0) {
      suggestions.push(`View ${twinData.twins[0].name} details`);
      suggestions.push(`Update ${twinData.twins[0].type} data`);
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Get list of active data sources
   */
  _getActiveSources(twinData, memoryData, intelligence) {
    const sources = [];
    if (twinData) sources.push('twinos-hub');
    if (memoryData) sources.push('genie-memory');
    if (intelligence) sources.push('nexha-intelligence');
    return sources;
  }
}

/**
 * Connection module for Business Copilot integration
 */
export const BusinessCopilotConnection = {
  name: 'Business Copilot → TwinOS Hub',
  version: '1.0.0',

  /**
   * Initialize connection
   */
  async initialize(config = {}) {
    const { logger } = config;

    // Test connections
    const tests = await Promise.allSettled([
      fetch(`${TWINOS_HUB_URL}/health`),
      fetch(`${GENIE_MEMORY_URL}/health`).catch(() => null),
      fetch(`${NEXHA_INTELLIGENCE_URL}/health`).catch(() => null)
    ]);

    const results = {
      twinosHub: tests[0].status === 'fulfilled' && tests[0].value.ok,
      genieMemory: tests[1].status === 'fulfilled',
      nexhaIntelligence: tests[2].status === 'fulfilled'
    };

    logger?.info('Business Copilot connections:', results);

    return results;
  },

  /**
   * Get the enhanced copilot class
   */
  getEnhancedCopilot(config) {
    return new BusinessCopilotWithTwins(config);
  }
};

export default BusinessCopilotConnection;
