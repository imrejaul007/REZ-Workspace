// ============================================================================
// Role AI Agents - Agent Service
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import type {
  JobRole,
  AgentLevel,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  RoleRecommendation,
  UserProfile,
  AgentSession,
} from '../types';
import { RoleAgent, AgentSession as AgentSessionModel } from '../models';
import { ROLE_INFO, getSystemPrompt, getLevelConfig, LEVEL_CONFIG } from './roleDefinitions';
import logger from '../utils/logger';
import config from '../config';

// ============================================================================
// Agent Service Class
// ============================================================================

export class AgentService {
  /**
   * Get all available roles
   */
  async getAllRoles() {
    try {
      const roles = Object.values(ROLE_INFO);

      // Get usage stats for each role
      const rolesWithStats = await Promise.all(
        roles.map(async (role) => {
          const stats = await RoleAgent.aggregate([
            { $match: { role: role.role } },
            {
              $group: {
                _id: null,
                totalChats: { $sum: '$usageStats.totalChats' },
                totalSessions: { $sum: '$usageStats.totalSessions' },
                agentCount: { $sum: 1 },
              },
            },
          ]);

          return {
            ...role,
            stats: stats[0] || { totalChats: 0, totalSessions: 0, agentCount: 0 },
          };
        })
      );

      return rolesWithStats;
    } catch (error) {
      logger.error('Error fetching roles', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get role info by ID
   */
  async getRoleById(roleId: JobRole) {
    try {
      const roleInfo = ROLE_INFO[roleId];
      if (!roleInfo) {
        throw new Error(`Role ${roleId} not found`);
      }

      // Get agents for this role
      const agents = await RoleAgent.find({ role: roleId }).select('-systemPrompt');

      return {
        ...roleInfo,
        agents: agents.map((agent) => ({
          level: agent.level,
          name: agent.name,
          title: agent.title,
          experience: agent.experience,
          usageStats: agent.usageStats,
        })),
      };
    } catch (error) {
      logger.error('Error fetching role', { roleId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get all levels for a role
   */
  async getRoleLevels(roleId: JobRole) {
    try {
      const roleInfo = ROLE_INFO[roleId];
      if (!roleInfo) {
        throw new Error(`Role ${roleId} not found`);
      }

      const levels = await RoleAgent.find({ role: roleId });

      return {
        role: roleInfo,
        levels: Object.entries(LEVEL_CONFIG).map(([key, config]) => {
          const agent = levels.find((a) => a.level === key);
          return {
            ...config,
            description: roleInfo.levels[key as AgentLevel],
            agentExists: !!agent,
            usageStats: agent?.usageStats || null,
          };
        }),
      };
    } catch (error) {
      logger.error('Error fetching role levels', { roleId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get specific role level
   */
  async getRoleLevel(roleId: JobRole, level: AgentLevel) {
    try {
      const roleInfo = ROLE_INFO[roleId];
      if (!roleInfo) {
        throw new Error(`Role ${roleId} not found`);
      }

      const levelConfig = LEVEL_CONFIG[level];
      if (!levelConfig) {
        throw new Error(`Level ${level} not found`);
      }

      const agent = await RoleAgent.findOne({ role: roleId, level });

      return {
        role: roleInfo,
        level: {
          ...levelConfig,
          description: roleInfo.levels[level],
          agent: agent
            ? {
                name: agent.name,
                title: agent.title,
                experience: agent.experience,
                capabilities: agent.capabilities,
                tools: agent.tools,
                traits: agent.traits,
                goals: agent.goals,
                constraints: agent.constraints,
                usageStats: agent.usageStats,
              }
            : null,
        },
      };
    } catch (error) {
      logger.error('Error fetching role level', { roleId, level, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Chat with a role agent
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { role, level, message, userId, context } = request;
    const sessionId = uuidv4();

    try {
      // Get system prompt for this role/level
      const systemPrompt = getSystemPrompt(role, level);
      const levelConfig = getLevelConfig(level);
      const roleInfo = ROLE_INFO[role];

      // Build conversation history
      const conversationHistory = context?.previousMessages || [];
      const fullContext = this.buildContext(role, level, roleInfo, levelConfig);

      // Generate response (simulated - in production, integrate with actual AI)
      const response = await this.generateResponse(
        systemPrompt,
        fullContext,
        message,
        conversationHistory
      );

      // Create session
      await this.createSession(sessionId, userId, role, level, message, response);

      // Update agent usage stats
      await RoleAgent.updateOne(
        { role, level },
        {
          $inc: { 'usageStats.totalChats': 1, 'usageStats.totalSessions': 1 },
          $set: { 'usageStats.lastUsed': new Date() },
        },
        { upsert: true }
      );

      // Generate suggestions based on role and level
      const suggestions = this.generateSuggestions(role, level, message);

      return {
        message: response,
        agent: {
          role,
          level,
          name: roleInfo?.name || role,
        },
        suggestions,
        timestamp: new Date(),
        sessionId,
      };
    } catch (error) {
      logger.error('Error in chat', { role, level, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Continue a chat session
   */
  async continueChat(sessionId: string, message: string): Promise<ChatResponse> {
    try {
      const session = await AgentSessionModel.findOne({ sessionId });
      if (!session) {
        throw new Error('Session not found');
      }

      // Update last activity
      session.lastActivity = new Date();
      session.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
      });

      // Get system prompt
      const systemPrompt = getSystemPrompt(session.role, session.level);
      const levelConfig = getLevelConfig(session.level);
      const roleInfo = ROLE_INFO[session.role];

      // Build conversation for context
      const conversationHistory = session.messages.slice(-10);
      const fullContext = this.buildContext(session.role, session.level, roleInfo, levelConfig);

      // Generate response
      const response = await this.generateResponse(
        systemPrompt,
        fullContext,
        message,
        conversationHistory
      );

      // Save to session
      session.messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });
      session.messageCount = session.messages.length;
      await session.save();

      // Update agent usage
      await RoleAgent.updateOne(
        { role: session.role, level: session.level },
        { $inc: { 'usageStats.totalChats': 1 } }
      );

      return {
        message: response,
        agent: {
          role: session.role,
          level: session.level,
          name: roleInfo?.name || session.role,
        },
        suggestions: this.generateSuggestions(session.role, session.level, message),
        timestamp: new Date(),
        sessionId,
      };
    } catch (error) {
      logger.error('Error continuing chat', { sessionId, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Recommend roles based on user profile
   */
  async recommendRoles(userProfile: Partial<UserProfile>): Promise<RoleRecommendation[]> {
    try {
      const recommendations: RoleRecommendation[] = [];

      // Analyze user skills and interests to match with roles
      for (const [roleId, roleInfo] of Object.entries(ROLE_INFO)) {
        const role = roleId as JobRole;
        const matchScore = this.calculateMatchScore(role, userProfile);
        const { skillGaps, growthPath } = this.analyzeGrowthPath(role, userProfile);

        if (matchScore > 20) {
          // Only recommend if at least 20% match
          const recommendedLevel = this.suggestLevel(role, userProfile);

          recommendations.push({
            role,
            roleName: roleInfo.name,
            levels: {
              recommended: recommendedLevel,
              alternatives: this.getAlternativeLevels(recommendedLevel),
            },
            matchScore,
            reasoning: this.generateReasoning(role, matchScore, userProfile),
            skillGaps,
            growthPath,
          });
        }
      }

      // Sort by match score
      recommendations.sort((a, b) => b.matchScore - a.matchScore);

      return recommendations.slice(0, 5); // Top 5 recommendations
    } catch (error) {
      logger.error('Error recommending roles', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<AgentSession | null> {
    try {
      const session = await AgentSessionModel.findOne({ sessionId });
      if (!session) return null;

      return {
        id: session.sessionId,
        userId: session.userId,
        role: session.role,
        level: session.level,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        metadata: {
          messageCount: session.messageCount,
          lastActivity: session.lastActivity,
        },
      };
    } catch (error) {
      logger.error('Error fetching session', { sessionId, error: (error as Error).message });
      throw error;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private buildContext(
    role: JobRole,
    level: AgentLevel,
    roleInfo: typeof ROLE_INFO[keyof typeof ROLE_INFO] | undefined,
    levelConfig: typeof LEVEL_CONFIG[keyof typeof LEVEL_CONFIG]
  ): string {
    return `
ROLE: ${roleInfo?.name || role}
LEVEL: ${levelConfig.name} (${levelConfig.experience})
FOCUS: ${levelConfig.primaryFocus}

${roleInfo?.description || ''}

Your response should reflect ${levelConfig.experience} of experience level.
Focus on ${levelConfig.primaryFocus.toLowerCase()}.
`;
  }

  private async generateResponse(
    systemPrompt: string,
    context: string,
    userMessage: string,
    history: ChatMessage[]
  ): Promise<string> {
    // In production, this would call an actual AI service (OpenAI, Claude, etc.)
    // For now, we generate contextual responses based on role and level

    const prompt = `
${systemPrompt}

${context}

CONVERSATION HISTORY:
${history.map((m) => `${m.role}: ${m.content}`).join('\n')}

USER: ${userMessage}

AI:
`;

    // Generate a contextual response based on the role and message
    // This is a simplified version - in production, use actual AI
    return this.generateContextualResponse(prompt, userMessage);
  }

  private generateContextualResponse(prompt: string, userMessage: string): string {
    const message = userMessage.toLowerCase();

    // Generic helpful responses based on common patterns
    if (message.includes('how') || message.includes('what') || message.includes('?')) {
      return this.generateAnswerResponse(prompt, userMessage);
    }

    if (message.includes('help') || message.includes('guide') || message.includes('suggest')) {
      return this.generateGuidanceResponse(prompt, userMessage);
    }

    if (message.includes('code') || message.includes('implement') || message.includes('build')) {
      return this.generateTechnicalResponse(prompt, userMessage);
    }

    if (message.includes('error') || message.includes('bug') || message.includes('issue')) {
      return this.generateDebugResponse(prompt, userMessage);
    }

    if (message.includes('plan') || message.includes('strategy') || message.includes('roadmap')) {
      return this.generateStrategicResponse(prompt, userMessage);
    }

    // Default contextual response
    return this.generateDefaultResponse(prompt, userMessage);
  }

  private generateAnswerResponse(prompt: string, userMessage: string): string {
    const role = this.extractRoleFromPrompt(prompt);
    return `Based on ${role} best practices, let me help you with that.

**Understanding your question:**
"${userMessage}"

**Here's what you need to know:**

1. **Start with the basics** - Understanding the fundamentals is key
2. **Consider the context** - Your specific situation matters
3. **Take incremental steps** - Small progress adds up

**Recommended approach:**
- Define the problem clearly
- Research available options
- Create a simple plan
- Execute and iterate

Would you like me to dive deeper into any specific aspect?`;
  }

  private generateGuidanceResponse(prompt: string, userMessage: string): string {
    const role = this.extractRoleFromPrompt(prompt);
    const level = this.extractLevelFromPrompt(prompt);

    return `Great question! As a ${level} professional in ${role}, here's my guidance:

**Step-by-step approach:**

1. **Assess the current state**
   - What resources do you have?
   - What's the timeline?

2. **Define success criteria**
   - What does good look like?
   - How will you measure progress?

3. **Identify potential challenges**
   - What could go wrong?
   - How will you mitigate risks?

4. **Create an action plan**
   - Break it into manageable steps
   - Set milestones

5. **Execute and learn**
   - Start with the highest impact items
   - Adjust based on feedback

Would you like me to help you work through any of these steps in more detail?`;
  }

  private generateTechnicalResponse(prompt: string, userMessage: string): string {
    return `Here's how I'd approach building that:

**Technical approach:**

\`\`\`
// Step 1: Define the structure
interface Solution {
  // What are the inputs?
  // What are the outputs?
  // What are the constraints?
}

// Step 2: Design the logic
function implement() {
  // Start simple
  // Add complexity only when needed
  // Keep it maintainable
}

// Step 3: Test thoroughly
describe('Solution', () => {
  it('should handle edge cases', () => {});
  it('should perform within constraints', () => {});
});
\`\`\`

**Key principles:**
- Keep it simple first
- Add error handling
- Consider scalability
- Document decisions

Would you like me to provide more specific implementation guidance?`;
  }

  private generateDebugResponse(prompt: string, userMessage: string): string {
    return `Let's debug this systematically:

**Troubleshooting approach:**

1. **Reproduce the issue**
   - Can you consistently reproduce it?
   - What are the exact steps?

2. **Gather information**
   - Error messages/logs
   - Environment details
   - Recent changes

3. **Narrow down the cause**
   - Isolate the problem
   - Test each component
   - Check recent changes

4. **Fix and verify**
   - Make minimal changes
   - Test thoroughly
   - Monitor for regressions

**Common culprits to check:**
- Data issues (null, undefined, wrong format)
- Configuration problems
- Network/API issues
- Timing/race conditions

What specific error are you seeing? I can help troubleshoot further.`;
  }

  private generateStrategicResponse(prompt: string, userMessage: string): string {
    return `Here's my strategic perspective:

**Strategic planning framework:**

**Phase 1: Discovery (Now)**
- Understand current state
- Gather stakeholder input
- Analyze data and trends
- Identify opportunities

**Phase 2: Strategy (Short-term)**
- Define vision and goals
- Identify key initiatives
- Assess resources and constraints
- Create roadmap

**Phase 3: Execution (Medium-term)**
- Build MVP/first phase
- Iterate based on feedback
- Measure progress
- Adjust as needed

**Phase 4: Scale (Long-term)**
- Expand successful initiatives
- Build on learnings
- Plan for growth
- Continuous improvement

**Key success factors:**
- Clear communication
- Stakeholder alignment
- Agile execution
- Data-driven decisions

Would you like me to help you develop any specific part of this strategy?`;
  }

  private generateDefaultResponse(prompt: string, userMessage: string): string {
    return `Thank you for sharing that. Let me provide some guidance:

**My thoughts:**

Based on what you've shared, here's my perspective:

1. **Acknowledge the situation**
   - I understand you're dealing with "${userMessage.substring(0, 50)}..."
   - This is a common challenge

2. **Provide initial guidance**
   - Start by defining the problem clearly
   - Break it into smaller parts
   - Focus on the highest impact items

3. **Offer support**
   - I'm here to help you work through this
   - Feel free to share more details
   - Ask follow-up questions

**Next steps:**
- What specific aspect would you like to explore first?
- Do you have constraints I should know about?
- What's your timeline?

Let me know how I can best help you move forward!`;
  }

  private extractRoleFromPrompt(prompt: string): string {
    const match = prompt.match(/ROLE:\s*(.+?)\n/);
    return match ? match[1].trim() : 'professional';
  }

  private extractLevelFromPrompt(prompt: string): string {
    const match = prompt.match(/LEVEL:\s*(.+?)\n/);
    return match ? match[1].trim() : 'professional';
  }

  private async createSession(
    sessionId: string,
    userId: string | undefined,
    role: JobRole,
    level: AgentLevel,
    userMessage: string,
    response: string
  ): Promise<void> {
    const session = new AgentSessionModel({
      sessionId,
      userId,
      role,
      level,
      messages: [
        { role: 'user', content: userMessage, timestamp: new Date() },
        { role: 'assistant', content: response, timestamp: new Date() },
      ],
      messageCount: 2,
      lastActivity: new Date(),
    });

    await session.save();
  }

  private generateSuggestions(role: JobRole, level: AgentLevel, message: string): string[] {
    const baseSuggestions = [
      'Can you give me more details?',
      'What are the best practices?',
      'How do I get started?',
    ];

    const roleSpecific: Record<JobRole, string[]> = {
      'software-engineer': [
        'Can you show me an example?',
        'How do I debug this?',
        'What is the best practice?',
        'How do I improve performance?',
      ],
      sales: [
        'How do I handle this objection?',
        'What should my next step be?',
        'How do I close this deal?',
      ],
      marketing: [
        'How do I measure success?',
        'What channels should I use?',
        'How do I create a campaign?',
      ],
      finance: [
        'How do I analyze this data?',
        'What metrics should I track?',
        'How do I present this to leadership?',
      ],
      hr: [
        'How do I handle this situation?',
        'What policy applies here?',
        'How do I develop this employee?',
      ],
      operations: [
        'How do I optimize this process?',
        'What KPIs should I track?',
        'How do I reduce costs?',
      ],
      product: [
        'How do I prioritize this?',
        'What metrics should I use?',
        'How do I validate this idea?',
      ],
      design: [
        'How do I improve this design?',
        'What principles should I follow?',
        'How do I get user feedback?',
      ],
      support: [
        'How do I resolve this issue?',
        'What information do I need?',
        'How do I escalate properly?',
      ],
      admin: [
        'How do I configure this?',
        'What permissions are needed?',
        'How do I audit this?',
      ],
    };

    return [
      ...(roleSpecific[role] || baseSuggestions).slice(0, 3),
      baseSuggestions[Math.floor(Math.random() * baseSuggestions.length)],
    ];
  }

  private calculateMatchScore(role: JobRole, profile: Partial<UserProfile>): number {
    let score = 30; // Base score

    // Role-specific skill matching
    const roleSkills: Record<JobRole, string[]> = {
      'software-engineer': ['coding', 'programming', 'development', 'testing', 'debugging', 'architecture'],
      sales: ['selling', 'negotiation', 'crm', 'pipeline', 'closing', 'prospecting'],
      marketing: ['campaigns', 'content', 'social media', 'seo', 'analytics', 'branding'],
      finance: ['accounting', 'budgeting', 'analysis', 'reporting', 'compliance', 'forecasting'],
      hr: ['recruiting', 'onboarding', 'policies', 'performance', 'training', 'engagement'],
      operations: ['processes', 'logistics', 'optimization', 'efficiency', 'workflows', 'vendor'],
      product: ['roadmap', 'prioritization', 'research', 'strategy', 'metrics', 'stakeholders'],
      design: ['ui', 'ux', 'prototyping', 'user research', 'visual design', 'design systems'],
      support: ['tickets', 'customer service', 'troubleshooting', 'escalation', 'knowledge base', 'csat'],
      admin: ['access', 'security', 'permissions', 'users', 'configuration', 'compliance'],
    };

    const relevantSkills = roleSkills[role] || [];
    const matchedSkills = profile.skills?.filter((s) =>
      relevantSkills.some((rs) => s.toLowerCase().includes(rs.toLowerCase()))
    ).length || 0;

    score += matchedSkills * 10;

    // Interest matching
    const matchedInterests = profile.interests?.filter((i) =>
      relevantSkills.some((rs) => i.toLowerCase().includes(rs.toLowerCase()))
    ).length || 0;

    score += matchedInterests * 5;

    // Experience adjustment
    if (profile.experience) {
      if (role === 'software-engineer' && profile.experience >= 3) score += 10;
      if (role === 'sales' && profile.experience >= 2) score += 10;
      if (role === 'product' && profile.experience >= 4) score += 10;
    }

    return Math.min(100, score);
  }

  private analyzeGrowthPath(role: JobRole, profile: Partial<UserProfile>): {
    skillGaps: string[];
    growthPath: string[];
  } {
    const roleSkills: Record<JobRole, { core: string[]; advanced: string[]; expert: string[] }> = {
      'software-engineer': {
        core: ['programming basics', 'git', 'testing'],
        advanced: ['system design', 'performance', 'architecture'],
        expert: ['tech strategy', 'hiring', 'org design'],
      },
      sales: {
        core: ['product knowledge', 'basic objection handling'],
        advanced: ['pipeline management', 'negotiation'],
        expert: ['revenue strategy', 'team leadership'],
      },
      marketing: {
        core: ['content creation', 'social media'],
        advanced: ['campaign management', 'analytics'],
        expert: ['brand strategy', 'market positioning'],
      },
      finance: {
        core: ['data entry', 'basic reporting'],
        advanced: ['financial modeling', 'forecasting'],
        expert: ['capital strategy', 'investor relations'],
      },
      hr: {
        core: ['onboarding', 'basic policies'],
        advanced: ['recruitment', 'performance management'],
        expert: ['culture strategy', 'org design'],
      },
      operations: {
        core: ['documentation', 'basic tasks'],
        advanced: ['workflow optimization', 'vendor management'],
        expert: ['ops strategy', 'scaling'],
      },
      product: {
        core: ['feature specs', 'user feedback'],
        advanced: ['roadmap management', 'prioritization'],
        expert: ['product vision', 'market fit'],
      },
      design: {
        core: ['design fundamentals', 'basic tools'],
        advanced: ['design systems', 'user research'],
        expert: ['brand strategy', 'design leadership'],
      },
      support: {
        core: ['ticket handling', 'basic troubleshooting'],
        advanced: ['escalation', 'knowledge base'],
        expert: ['support strategy', 'customer success'],
      },
      admin: {
        core: ['system access', 'basic permissions'],
        advanced: ['access control', 'compliance'],
        expert: ['security strategy', 'governance'],
      },
    };

    const skills = roleSkills[role] || { core: [], advanced: [], expert: [] };
    const userSkills = profile.skills || [];

    const skillGaps = skills.core.filter(
      (s) => !userSkills.some((us) => us.toLowerCase().includes(s.toLowerCase()))
    );

    const growthPath = [
      `Master ${skills.core.slice(0, 2).join(' and ')}`,
      `Develop expertise in ${skills.advanced.slice(0, 2).join(' and ')}`,
      `Build strategic skills in ${skills.expert.slice(0, 2).join(' and ')}`,
    ];

    return { skillGaps, growthPath };
  }

  private suggestLevel(role: JobRole, profile: Partial<UserProfile>): AgentLevel {
    const exp = profile.experience || 0;
    const currentLevel = profile.currentLevel;

    if (currentLevel) return currentLevel;

    if (exp <= 2) return 'L1';
    if (exp <= 5) return 'L2';
    if (exp <= 8) return 'L3';
    return 'L4';
  }

  private getAlternativeLevels(recommended: AgentLevel): AgentLevel[] {
    const allLevels: AgentLevel[] = ['L1', 'L2', 'L3', 'L4'];
    return allLevels.filter((l) => l !== recommended);
  }

  private generateReasoning(
    role: JobRole,
    matchScore: number,
    profile: Partial<UserProfile>
  ): string[] {
    const reasons: string[] = [];

    if (matchScore >= 70) {
      reasons.push(`Strong match based on your skills and experience`);
    } else if (matchScore >= 50) {
      reasons.push(`Good alignment with your background`);
    } else {
      reasons.push(`Potential for growth with your current skills`);
    }

    if (profile.experience) {
      if (profile.experience <= 2) {
        reasons.push(`Entry-level role suits your ${profile.experience} years of experience`);
      } else if (profile.experience <= 5) {
        reasons.push(`Mid-level opportunity matches your experience`);
      } else {
        reasons.push(`Senior role leverages your ${profile.experience} years of expertise`);
      }
    }

    if (profile.interests?.length) {
      reasons.push(`Aligns with your interests in ${profile.interests.slice(0, 2).join(', ')}`);
    }

    return reasons;
  }
}

// Export singleton instance
export const agentService = new AgentService();
