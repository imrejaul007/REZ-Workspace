// ==========================================
// MyTalent - AI Copilot Service Integration
// REZ Intelligence - Port 4033
// ==========================================

import { AIChatMessage } from '../types';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:4033';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

interface AIResponse {
  success: boolean;
  message?: string;
  suggestions?: string[];
  error?: string;
}

/**
 * Send chat message to AI copilot
 */
export async function sendChatMessage(
  employeeId: string,
  message: string,
  context?: 'career' | 'benefits' | 'payroll' | 'general'
): Promise<AIResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AI_SERVICE_URL) {
      // Mock AI responses based on message content
      const response = generateMockResponse(message, context);
      return {
        success: true,
        message: response.message,
        suggestions: response.suggestions,
      };
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, message, context }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message,
        suggestions: data.suggestions,
      };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('AI chat error:', error);
    const response = generateMockResponse(message, context);
    return {
      success: true,
      message: response.message,
      suggestions: response.suggestions,
    };
  }
}

/**
 * Generate mock AI responses
 */
function generateMockResponse(
  message: string,
  context?: string
): { message: string; suggestions: string[] } {
  const lowerMessage = message.toLowerCase();

  // Career related
  if (lowerMessage.includes('career') || lowerMessage.includes('promotion') || lowerMessage.includes('growth')) {
    return {
      message: "Based on your current performance and skill set, you're on track for a promotion in the next 6-12 months. Key areas to focus on: Leadership skills and cross-functional collaboration. Would you like me to create a personalized development plan?",
      suggestions: [
        "Create my development plan",
        "What skills do I need?",
        "Show me career paths",
      ],
    };
  }

  // Skills related
  if (lowerMessage.includes('skill') || lowerMessage.includes('learn')) {
    return {
      message: "I've analyzed your profile and identified 3 key skills to develop:\n\n1. **Cloud Architecture** - Critical for your next role\n2. **Team Leadership** - Needed for promotion\n3. **Data Analysis** - High demand skill\n\nWould you like course recommendations for any of these?",
      suggestions: [
        "Get course recommendations",
        "Show skill gap analysis",
        "Build a learning plan",
      ],
    };
  }

  // Benefits related
  if (lowerMessage.includes('benefit') || lowerMessage.includes('insurance') || lowerMessage.includes('health')) {
    return {
      message: "You have ₹1.5L+ in annual benefits including:\n\n• Health Insurance: ₹5L coverage\n• Wellness: Gym & mental health support\n• Learning: ₹50,000 annual budget\n• Travel: ₹24,000 allowance\n\nWould you like to explore any specific benefit category?",
      suggestions: [
        "Explore health benefits",
        "View wellness options",
        "Check learning budget",
      ],
    };
  }

  // Leave related
  if (lowerMessage.includes('leave') || lowerMessage.includes('holiday') || lowerMessage.includes('vacation')) {
    return {
      message: "Your current leave balance:\n\n• Sick: 6 days\n• Casual: 5 days\n• Earned: 12 days\n• WFH: 8 days\n\nYou have 15 upcoming holidays this year. Would you like help planning your time off?",
      suggestions: [
        "Apply for leave",
        "View upcoming holidays",
        "Check WFH balance",
      ],
    };
  }

  // Payroll related
  if (lowerMessage.includes('salary') || lowerMessage.includes('pay') || lowerMessage.includes('payslip')) {
    return {
      message: "Your latest payslip details:\n\n• Basic: ₹45,000\n• Allowances: ₹15,000\n• Deductions: ₹8,500\n• Net Pay: ₹51,500\n\nNext payday: June 1, 2026. Would you like to see a breakdown or download your payslip?",
      suggestions: [
        "Download payslip",
        "View tax details",
        "Check PF balance",
      ],
    };
  }

  // Attendance related
  if (lowerMessage.includes('attendance') || lowerMessage.includes('check-in') || lowerMessage.includes('check-out')) {
    return {
      message: "Today's attendance status:\n\n• Check-in: 9:15 AM\n• Status: Present\n• Hours worked: 3h 45m\n\nYour monthly attendance rate is 95%. Keep up the great work!",
      suggestions: [
        "View attendance history",
        "Request WFH",
        "Check monthly summary",
      ],
    };
  }

  // General greeting
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      message: "Hello! I'm your MyTalent AI assistant. I can help you with:\n\n• Career guidance and skill development\n• Benefits and insurance queries\n• Payroll and tax information\n• Leave management\n• General HR questions\n\nWhat would you like to know?",
      suggestions: [
        "Career advice",
        "My benefits",
        "Payroll info",
        "Leave balance",
      ],
    };
  }

  // Default response
  return {
    message: "I understand you're asking about: \"" + message + "\"\n\nAs your HR assistant, I can help you with career development, benefits, payroll, leave, and general HR queries. How can I assist you today?",
    suggestions: [
      "Career guidance",
      "Benefits information",
      "Payroll details",
      "Leave management",
    ],
  };
}

/**
 * Get AI-powered recommendations
 */
export async function getAIRecommendations(
  employeeId: string,
  type: 'career' | 'learning' | 'benefits' | 'wellness'
): Promise<{ success: boolean; recommendations?: any[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AI_SERVICE_URL) {
      const recommendations = getMockRecommendations(type);
      return { success: true, recommendations };
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/api/ai/recommendations/${type}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, recommendations: data.recommendations };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('AI recommendations error:', error);
    return { success: true, recommendations: getMockRecommendations(type) };
  }
}

/**
 * Get mock recommendations based on type
 */
function getMockRecommendations(type: string): any[] {
  switch (type) {
    case 'career':
      return [
        { title: 'Tech Lead Path', description: 'Develop leadership skills', score: 85 },
        { title: 'Senior Engineer', description: 'Deep technical expertise', score: 78 },
        { title: 'Product Manager', description: 'Cross-functional role', score: 65 },
      ];
    case 'learning':
      return [
        { title: 'AWS Solutions Architect', provider: 'AWS Training', duration: '40 hours', priority: 'high' },
        { title: 'Leadership Essentials', provider: 'Coursera', duration: '20 hours', priority: 'medium' },
        { title: 'Data Analysis with Python', provider: 'DataCamp', duration: '30 hours', priority: 'medium' },
      ];
    case 'benefits':
      return [
        { title: 'Health Checkup Package', description: 'Free annual checkup', value: '₹5,000' },
        { title: 'Mental Wellness', description: '4 free therapy sessions', value: '₹8,000' },
        { title: 'Learning Subscription', description: 'Coursera Pro subscription', value: '₹2,999/year' },
      ];
    case 'wellness':
      return [
        { title: 'Gym Membership', description: '₹1,500/month allowance', status: 'unused' },
        { title: 'Meditation App', description: '1 year subscription free', status: 'available' },
        { title: 'Health Challenge', description: 'Complete for 500 bonus coins', status: 'in-progress' },
      ];
    default:
      return [];
  }
}

/**
 * Get insights
 */
export async function getInsights(
  employeeId: string
): Promise<{ success: boolean; insights?: any[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AI_SERVICE_URL) {
      return {
        success: true,
        insights: [
          { type: 'productivity', title: 'Peak Productivity Hours', description: 'You\'re most productive between 10 AM - 12 PM', icon: '📈' },
          { type: 'engagement', title: 'Team Collaboration', description: 'You\'ve collaborated with 15 team members this month', icon: '🤝' },
          { type: 'growth', title: 'Learning Streak', description: 'You\'ve completed 3 courses this quarter!', icon: '🎓' },
          { type: 'wellness', title: 'Work-Life Balance', description: 'Your after-hours activity has decreased by 20%', icon: '⚖️' },
        ],
      };
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/insights/${employeeId}`, {
      method: 'GET',
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, insights: data.insights };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get insights error:', error);
    return { success: true, insights: [] };
  }
}

/**
 * Analyze sentiment
 */
export async function analyzeSentiment(
  employeeId: string,
  text: string
): Promise<{ success: boolean; sentiment?: string; score?: number; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AI_SERVICE_URL) {
      return { success: true, sentiment: 'positive', score: 0.85 };
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, text }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        sentiment: data.sentiment,
        score: data.score,
      };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Analyze sentiment error:', error);
    return { success: true, sentiment: 'neutral', score: 0.5 };
  }
}
