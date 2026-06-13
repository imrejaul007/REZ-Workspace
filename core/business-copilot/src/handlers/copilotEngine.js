/**
 * Enhanced Copilot Engine - AI-powered with LLM integration
 * Full end-to-end flow: Question → Twin → Memory → Intelligence → Answer
 */

import fetch from 'node-fetch';
import { LLMService } from '../services/llmService.js';

const TWINOS_HUB_URL = process.env.TWINOS_HUB_URL || 'http://localhost:4000';
const GENIE_MEMORY_URL = process.env.GENIE_MEMORY_URL || 'http://localhost:5001';
// Note: Genie Memory uses /api/memories/search endpoint
const NEXHA_INTELLIGENCE_URL = process.env.NEXHA_INTELLIGENCE_URL || 'http://localhost:4350';
const SUTAR_DECISION_URL = process.env.SUTAR_DECISION_URL || 'http://localhost:4240';

/**
 * Industry-specific system prompts
 */
const INDUSTRY_PROMPTS = {
  legal: `You are a legal industry expert assistant. You help with:
- Case research and precedents
- Contract drafting and review
- Compliance monitoring
- Billing and time tracking
- Client intake and management

Provide specific, actionable guidance while noting when legal advice requires a licensed attorney.`,

  healthcare: `You are a healthcare industry expert assistant. You help with:
- Patient intake and scheduling
- Medical coding (ICD-10, CPT)
- Claims processing
- Insurance verification
- Prior authorization

Be mindful of HIPAA compliance in all responses.`,

  finance: `You are a finance industry expert assistant. You help with:
- Bookkeeping and reconciliation
- Invoice generation and tracking
- Tax preparation and deadlines
- Payroll processing
- Expense management

Provide accurate financial guidance.`,

  retail: `You are a retail industry expert assistant. You help with:
- Inventory management and reordering
- POS operations
- Customer loyalty programs
- Upselling and promotions
- Customer support

Focus on increasing sales and operational efficiency.`,

  restaurant: `You are a restaurant industry expert assistant. You help with:
- Reservation management
- Order processing
- Inventory and supplier management
- Staff scheduling
- Marketing promotions

Help optimize restaurant operations and customer experience.`,

  default: `You are an RTMN Business Copilot, helping businesses across multiple industries.
Provide clear, actionable guidance tailored to the specific industry context.`
};

/**
 * Enhanced Copilot Engine
 */
export class CopilotEngine {
  constructor(config = {}) {
    this.skillRegistry = config.skillRegistry;
    this.logger = config.logger;
    this.llmService = new LLMService({ logger: config.logger });
  }

  /**
   * Process user message with full AI capabilities
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

    // 5. Generate enhanced response using LLM
    const response = await this._generateResponse({
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

    // 7. Determine confidence
    const confidence = this._calculateConfidence(twinData, memoryData, intelligence);

    return {
      content: response.content,
      raw: response.raw,
      skills: relevantSkills.map(s => s.name),
      suggestions,
      sources: this._getActiveSources(twinData, memoryData, intelligence),
      twinData,
      memoryData,
      intelligence,
      confidence,
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Find relevant skills based on message
   */
  _findRelevantSkills(message, industry) {
    const m = message.toLowerCase();
    const skills = this.skillRegistry.getByIndustry(industry);

    // Match skills based on keywords
    const matchedSkills = skills.filter(skill => {
      const keywords = [
        ...skill.name.toLowerCase().split(' '),
        ...skill.description.toLowerCase().split(' '),
        ...skill.prompts.map(p => p.toLowerCase())
      ];

      return keywords.some(k => m.includes(k));
    });

    // If no matches, return all skills for industry
    return matchedSkills.length > 0 ? matchedSkills : skills.slice(0, 3);
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

      const data = await response.json();
      return {
        twins: data.twins || [],
        totalCount: data.total || 0
      };
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
          limit: 5
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
      // For commerce/retail industries, query Nexha Intelligence
      const commerceIndustries = ['retail', 'restaurant', 'manufacturing', 'distribution'];

      if (commerceIndustries.includes(industry)) {
        const response = await fetch(`${NEXHA_INTELLIGENCE_URL}/api/insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: message,
            industry,
            context
          })
        });

        if (response.ok) {
          return await response.json();
        }
      }

      // Fallback to basic analytics
      const response = await fetch(`${NEXHA_INTELLIGENCE_URL}/api/analytics/overview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message, industry })
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
   * Generate enhanced response using LLM
   */
  async _generateResponse({ message, industry, context, skills, twinData, memoryData, intelligence }) {
    // Build context for LLM
    const llmContext = {
      twinData,
      memoryData,
      intelligence,
      industry,
      skills: skills.map(s => s.name)
    };

    // Get industry-specific system prompt
    const systemPrompt = INDUSTRY_PROMPTS[industry] || INDUSTRY_PROMPTS.default;

    // Build the prompt
    let userPrompt = `User Question: "${message}"\n\n`;

    if (twinData?.twins?.length > 0) {
      userPrompt += `Relevant Digital Twins Found (${twinData.twins.length}):\n`;
      twinData.twins.slice(0, 3).forEach(twin => {
        userPrompt += `- ${twin.name}: ${twin.description}\n`;
      });
      userPrompt += '\n';
    }

    if (memoryData?.items?.length > 0) {
      userPrompt += `From Memory/Context:\n`;
      memoryData.items.slice(0, 2).forEach(item => {
        userPrompt += `- ${item.content || item.text || JSON.stringify(item).slice(0, 100)}\n`;
      });
      userPrompt += '\n';
    }

    if (intelligence?.insights?.length > 0) {
      userPrompt += `Intelligence Insights:\n`;
      intelligence.insights.slice(0, 3).forEach(insight => {
        userPrompt += `- ${insight}\n`;
      });
      userPrompt += '\n';
    }

    if (skills.length > 0) {
      userPrompt += `Relevant Skills:\n`;
      skills.slice(0, 3).forEach(skill => {
        userPrompt += `- ${skill.name}: ${skill.description}\n`;
      });
    }

    try {
      // Call LLM
      const llmResponse = await this.llmService.complete({
        prompt: userPrompt,
        systemPrompt,
        context: llmContext,
        conversationHistory: context?.history || []
      });

      return {
        content: llmResponse.content,
        raw: llmResponse
      };
    } catch (error) {
      this.logger?.error('LLM call failed:', error);

      // Fallback to template response
      return {
        content: this._generateTemplateResponse({ message, industry, skills, twinData }),
        raw: null
      };
    }
  }

  /**
   * Fallback template response when LLM unavailable
   */
  _generateTemplateResponse({ message, industry, skills, twinData }) {
    const skill = skills[0];

    let response = `Based on your question about "${message}"`;

    if (industry) {
      response += ` in the ${industry} industry`;
    }

    response += `, here's what I found:\n\n`;

    if (twinData?.twins?.length > 0) {
      response += `**Related Digital Twins:**\n`;
      twinData.twins.slice(0, 3).forEach(twin => {
        response += `- ${twin.name}: ${twin.description}\n`;
      });
      response += '\n';
    }

    if (skill) {
      response += `**Recommended Action:**\n`;
      response += `Use the "${skill.name}" skill for: ${skill.description}\n\n`;
    }

    response += `Would you like me to:\n`;
    response += `1. Show more details about these twins?\n`;
    response += `2. Take action using one of the skills?\n`;
    response += `3. Analyze this with more intelligence data?`;

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
      suggestions.push(`Get analytics for ${twinData.twins[0].name}`);
    }

    return suggestions.slice(0, 6);
  }

  /**
   * Calculate confidence based on available data
   */
  _calculateConfidence(twinData, memoryData, intelligence) {
    let score = 0.3; // Base score

    if (twinData?.twins?.length > 0) score += 0.25;
    if (memoryData?.items?.length > 0) score += 0.2;
    if (intelligence?.insights?.length > 0) score += 0.25;

    return Math.min(score, 0.95);
  }

  /**
   * Get list of active data sources
   */
  _getActiveSources(twinData, memoryData, intelligence) {
    const sources = [];
    if (twinData) sources.push({ name: 'TwinOS Hub', status: 'connected' });
    if (memoryData) sources.push({ name: 'Genie Memory', status: 'connected' });
    if (intelligence) sources.push({ name: 'Nexha Intelligence', status: 'connected' });
    if (this.llmService) sources.push({ name: 'LLM Service', status: 'connected' });
    return sources;
  }
}

/**
 * BOA Executive Intelligence Engine
 * Answers complex executive questions
 */
export class BOAEngine {
  constructor(config = {}) {
    this.logger = config.logger;
    this.llmService = new LLMService({ logger: config.logger });
  }

  /**
   * Execute executive query
   * Example: "Why did revenue drop this week?"
   */
  async query({ question, industry, context }) {
    const startTime = Date.now();

    // 1. Analyze the question
    const analysis = this._analyzeQuestion(question);

    // 2. Gather data from all sources
    const data = await this._gatherData({ analysis, industry, context });

    // 3. Analyze with LLM
    const analysis_result = await this._analyzeData({ question, analysis, data });

    // 4. Generate executive summary
    const summary = await this._generateSummary({ question, analysis, data, analysis_result });

    return {
      question,
      summary,
      analysis: analysis_result,
      data,
      recommendations: this._extractRecommendations(analysis_result),
      confidence: data.confidence || 0.7,
      sources: data.sources,
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Analyze question to determine what data to gather
   */
  _analyzeQuestion(question) {
    const q = question.toLowerCase();

    return {
      type: q.includes('why') ? 'diagnosis' :
            q.includes('what') ? 'information' :
            q.includes('how') ? 'guidance' :
            q.includes('predict') || q.includes('forecast') ? 'prediction' :
            'general',
      topics: [],
      timeRange: q.includes('today') ? 'day' :
                 q.includes('week') ? 'week' :
                 q.includes('month') ? 'month' : 'quarter',
      entities: []
    };
  }

  /**
   * Gather data from all relevant sources
   */
  async _gatherData({ analysis, industry, context }) {
    const sources = [];
    const data = {};

    // Query TwinOS Hub
    try {
      const twinResponse = await fetch(`${TWINOS_HUB_URL}/twins/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: analysis.type === 'diagnosis' ? 'revenue sales' : industry,
          industry,
          limit: 10
        })
      });

      if (twinResponse.ok) {
        data.twins = await twinResponse.json();
        sources.push('TwinOS Hub');
      }
    } catch (e) {
      this.logger?.warn('TwinOS query failed');
    }

    // Query Nexha Intelligence for analytics
    try {
      const intelResponse = await fetch(`${NEXHA_INTELLIGENCE_URL}/api/analytics/overview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'revenue trends analysis',
          industry,
          period: analysis.timeRange
        })
      });

      if (intelResponse.ok) {
        data.intelligence = await intelResponse.json();
        sources.push('Nexha Intelligence');
      }
    } catch (e) {
      this.logger?.warn('Nexha query failed');
    }

    // Query Genie Memory for context
    try {
      const memoryResponse = await fetch(`${GENIE_MEMORY_URL}/memory/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: industry,
          userId: context?.userId,
          limit: 5
        })
      });

      if (memoryResponse.ok) {
        data.memory = await memoryResponse.json();
        sources.push('Genie Memory');
      }
    } catch (e) {
      this.logger?.warn('Memory query failed');
    }

    return {
      ...data,
      sources,
      confidence: sources.length / 3
    };
  }

  /**
   * Analyze data with LLM
   */
  async _analyzeData({ question, analysis, data }) {
    const prompt = `
Executive Question: "${question}"

Analysis Type: ${analysis.type}
Industry: ${analysis.industry || 'general'}
Time Range: ${analysis.timeRange}

Available Data:
${JSON.stringify(data, null, 2).slice(0, 2000)}

Please analyze this data and provide:
1. Key findings
2. Root causes (if diagnostic question)
3. Supporting evidence
4. Confidence level

Format your response as a structured analysis.
`;

    try {
      const response = await this.llmService.complete({
        prompt,
        systemPrompt: 'You are an executive business analyst. Provide clear, actionable insights.',
        context: data
      });

      return {
        content: response.content,
        usage: response.usage
      };
    } catch (error) {
      this.logger?.error('Analysis failed:', error);
      return {
        content: 'Analysis unavailable due to system error.',
        usage: null
      };
    }
  }

  /**
   * Generate executive summary
   */
  async _generateSummary({ question, analysis, data, analysis_result }) {
    const prompt = `
Executive Question: "${question}"

Data Sources Connected: ${data.sources?.join(', ') || 'None'}
Data Quality: ${data.confidence ? Math.round(data.confidence * 100) + '%' : 'Unknown'}

Analysis:
${analysis_result.content}

Please provide a concise executive summary (3-5 sentences max) that:
1. Directly answers the question
2. Highlights key insights
3. Provides actionable recommendations
`;

    try {
      const response = await this.llmService.complete({
        prompt,
        systemPrompt: 'You are an executive assistant. Be concise and actionable.',
        context: data
      });

      return response.content;
    } catch (error) {
      return `Based on available data: ${analysis_result.content.slice(0, 200)}`;
    }
  }

  /**
   * Extract recommendations from analysis
   */
  _extractRecommendations(analysis_result) {
    // In production, this would parse structured recommendations
    // For now, return a generic structure
    return [
      {
        action: 'Review data',
        priority: 'medium',
        description: 'Review the detailed analysis for more insights'
      }
    ];
  }
}

export default CopilotEngine;
