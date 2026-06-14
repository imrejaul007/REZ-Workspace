import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../config/index.js';

export interface AICheckResult {
  passed: boolean;
  score: number;
  violations: Array<{
    type: string;
    severity: string;
    description: string;
    matchedContent: string;
    suggestion?: string;
  }>;
  reasoning: string;
}

export interface FixSuggestion {
  original: string;
  suggested: string;
  reason: string;
  confidence: number;
}

export class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private useOpenAI: boolean = false;
  private useAnthropic: boolean = false;

  constructor() {
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.useOpenAI = true;
      logger.info('OpenAI client initialized');
    }

    if (anthropicKey && anthropicKey !== 'your_anthropic_api_key_here') {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
      this.useAnthropic = true;
      logger.info('Anthropic client initialized');
    }
  }

  async analyzeContent(text: string, platform: string): Promise<AICheckResult> {
    if (!this.useOpenAI && !this.useAnthropic) {
      logger.warn('No AI provider configured, returning default pass');
      return {
        passed: true,
        score: 100,
        violations: [],
        reasoning: 'No AI provider configured',
      };
    }

    const prompt = this.buildAnalysisPrompt(text, platform);

    try {
      if (this.useOpenAI) {
        return await this.analyzeWithOpenAI(prompt, text);
      } else {
        return await this.analyzeWithAnthropic(prompt, text);
      }
    } catch (error) {
      logger.error('AI analysis failed', { error });
      throw error;
    }
  }

  private buildAnalysisPrompt(text: string, platform: string): string {
    return `You are a content compliance expert for advertising and marketing content on ${platform}.

Analyze the following content for compliance issues:

CONTENT:
${text}

Check for:
1. Brand safety issues (controversial topics, sensitive subjects)
2. Platform policy violations (${platform} specific rules)
3. Copyright concerns (trademarks, music, images)
4. FTC disclosure requirements (#Ad, sponsored content)
5. Inappropriate content (violence, adult content, hate speech)
6. Competitor mentions
7. Misleading claims

Respond in JSON format:
{
  "passed": boolean,
  "score": number (0-100),
  "violations": [
    {
      "type": string,
      "severity": "critical|high|medium|low",
      "description": string,
      "matchedContent": string,
      "suggestion": string
    }
  ],
  "reasoning": string
}

Only flag violations that are clearly present. If content is compliant, set passed=true and violations=[].

JSON Response:`;
  }

  private async analyzeWithOpenAI(prompt: string, text: string): Promise<AICheckResult> {
    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      return JSON.parse(content) as AICheckResult;
    } catch {
      logger.error('Failed to parse OpenAI response', { content });
      return {
        passed: true,
        score: 100,
        violations: [],
        reasoning: 'Failed to parse AI response',
      };
    }
  }

  private async analyzeWithAnthropic(prompt: string, text: string): Promise<AICheckResult> {
    const response = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    try {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AICheckResult;
      }
      return JSON.parse(content.text) as AICheckResult;
    } catch {
      logger.error('Failed to parse Anthropic response', { content: content.text });
      return {
        passed: true,
        score: 100,
        violations: [],
        reasoning: 'Failed to parse AI response',
      };
    }
  }

  async getFixSuggestions(
    text: string,
    violations: Array<{ type: string; matchedContent: string; description: string }>
  ): Promise<FixSuggestion[]> {
    if (!this.useOpenAI && !this.useAnthropic) {
      return violations.map((v) => ({
        original: v.matchedContent,
        suggested: '[REDACTED]',
        reason: `Remove content flagged as ${v.type}`,
        confidence: 0.8,
      }));
    }

    const prompt = `You are a content compliance expert. The following content has compliance issues:

ORIGINAL CONTENT:
${text}

VIOLATIONS FOUND:
${violations.map((v, i) => `${i + 1}. ${v.type}: "${v.matchedContent}" - ${v.description}`).join('\n')}

Generate suggested fixes that:
1. Remove or replace the violating content
2. Maintain the overall message and intent
3. Make content compliant with platform policies

Respond in JSON format:
{
  "suggestions": [
    {
      "original": string,
      "suggested": string,
      "reason": string,
      "confidence": number (0-1)
    }
  ]
}

JSON Response:`;

    try {
      if (this.useOpenAI) {
        const response = await this.openai!.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 1500,
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return parsed.suggestions || [];
        }
      } else if (this.useAnthropic) {
        const response = await this.anthropic!.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        });

        const textContent = response.content[0];
        if (textContent.type === 'text') {
          const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.suggestions || [];
          }
        }
      }
    } catch (error) {
      logger.error('Failed to get fix suggestions', { error });
    }

    // Fallback to simple suggestions
    return violations.map((v) => ({
      original: v.matchedContent,
      suggested: '[REDACTED]',
      reason: `Remove content flagged as ${v.type}`,
      confidence: 0.8,
    }));
  }

  async generateComplianceReport(
    checks: Array<{ contentId: string; text: string; score: number; violations: Array<{ type: string; severity: string }> }>
  ): Promise<string> {
    const summary = {
      totalChecks: checks.length,
      passedChecks: checks.filter((c) => c.score >= 80).length,
      failedChecks: checks.filter((c) => c.score < 50).length,
      averageScore: checks.reduce((sum, c) => sum + c.score, 0) / checks.length,
      criticalViolations: checks.flatMap((c) => c.violations.filter((v) => v.severity === 'critical')).length,
    };

    const prompt = `Generate a compliance report summary based on the following data:

SUMMARY:
- Total Checks: ${summary.totalChecks}
- Passed Checks: ${summary.passedChecks}
- Failed Checks: ${summary.failedChecks}
- Average Score: ${summary.averageScore.toFixed(1)}%
- Critical Violations: ${summary.criticalViolations}

Provide a professional report summary in markdown format with:
1. Executive Summary
2. Key Findings
3. Recommendations
4. Compliance Score Breakdown

Format the response professionally for stakeholders.`;

    try {
      if (this.useOpenAI) {
        const response = await this.openai!.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2000,
        });

        return response.choices[0]?.message?.content || 'Report generation failed';
      } else if (this.useAnthropic) {
        const response = await this.anthropic!.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        });

        const textContent = response.content[0];
        if (textContent.type === 'text') {
          return textContent.text;
        }
      }
    } catch (error) {
      logger.error('Failed to generate report', { error });
    }

    return `## Compliance Report Summary

**Total Checks:** ${summary.totalChecks}
**Passed:** ${summary.passedChecks}
**Failed:** ${summary.failedChecks}
**Average Score:** ${summary.averageScore.toFixed(1)}%
**Critical Violations:** ${summary.criticalViolations}

*Note: AI-generated report unavailable*`;
  }
}

export const aiService = new AIService();