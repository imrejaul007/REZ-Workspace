/**
 * AI Guardian
 *
 * Conversational AI for fraud queries and security advice.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GuardianQuery,
  GuardianResponse,
  GuardianCategory
} from '../types/index.js';

// ============================================
// RESPONSE TEMPLATES
// ============================================

const RESPONSE_TEMPLATES = {
  scam_check: {
    keywords: ['scam', 'fraud', 'fake', 'real', 'genuine', 'legit', 'trust', 'safe'],
    responses: [
      {
        match: /is this (scam|fake|fraud)/i,
        response: (match: RegExpMatchArray) =>
          "Based on the patterns you described, this could be a scam. Here's how to verify:\n\n" +
          "1. Check the sender's official website or app\n" +
          "2. Never share OTP or passwords\n" +
          "3. Banks never ask for personal details via call/SMS\n" +
          "4. When in doubt, call the official number\n\n" +
          "Would you like me to analyze a specific message or number?"
      },
      {
        match: /(bank|call|sms|message)/i,
        response: () =>
          "Here's how to identify fake bank communications:\n\n" +
          "🚨 RED FLAGS:\n" +
          "• Urgency: 'Your account will be blocked'\n" +
          "• OTP requests: 'Share your OTP'\n" +
          "• Links: Click to verify (fake links)\n" +
          "• Threats: Legal action, arrest\n\n" +
          "✅ SAFE BEHAVIOR:\n" +
          "• Verify through official app\n" +
          "• Call number on your card\n" +
          "• Never share OTP\n" +
          "• Report to 1930 (cyber crime)"
      }
    ]
  },

  upi_safety: {
    keywords: ['upi', 'payment', 'pay', 'transaction', 'transfer', 'send money'],
    responses: [
      {
        match: /is this (upi|payment|merchant) safe/i,
        response: () =>
          "Here's how to verify a UPI payment is safe:\n\n" +
          "✅ VERIFY BEFORE PAYING:\n" +
          "• Check merchant name matches the business\n" +
          "• Look for verified badge\n" +
          "• Check trust score (higher = safer)\n" +
          "• Read recent reviews/complaints\n\n" +
          "⚠️ WARNING SIGNS:\n" +
          "• New merchant with no reviews\n" +
          "• Pressure to pay quickly\n" +
          "• Amount seems wrong\n" +
          "• Requesting to pay a 'fee'\n\n" +
          "Would you like me to check a specific UPI ID?"
      },
      {
        match: /upi.*(scam|fraud|fake)/i,
        response: () =>
          "Common UPI scams to watch out for:\n\n" +
          "🔴 QR Code Scam:\n" +
          "• Someone asks you to scan QR to 'receive' money\n" +
          "• Reality: Scanning QR SENDS money\n\n" +
          "🔴 Collect Request:\n" +
          "• Fake delivery app messages\n" +
          "• 'Pay ₹50 to reschedule delivery'\n\n" +
          "🔴 Fake Customer Care:\n" +
          "• Search for helpline, get fake number\n" +
          "• They ask for UPI to 'refund'\n\n" +
          "PRO TIP: Use CorpID Shield to scan QR codes and verify UPI IDs before paying!"
      }
    ]
  },

  password_security: {
    keywords: ['password', 'change', 'hack', 'breach', 'compromised', 'leak'],
    responses: [
      {
        match: /password.*(hack|leak|breach)/i,
        response: () =>
          "What to do if your password is compromised:\n\n" +
          "🚨 IMMEDIATE STEPS:\n" +
          "1. Change password immediately\n" +
          "2. Enable 2FA/MFA\n" +
          "3. Check for unauthorized access\n" +
          "4. Review recent transactions\n\n" +
          "💡 PREVENTION:\n" +
          "• Use unique passwords for each account\n" +
          "• Use a password manager\n" +
          "• Never share passwords\n" +
          "• Use passphrases (e.g., 'Mango#Rain$7')"
      },
      {
        match: /check.*(breach|leak)/i,
        response: () =>
          "I'll check if your data has been in any breaches.\n\n" +
          "Use the Breach Monitor feature in CorpID Shield to:\n" +
          "• Check if your email is leaked\n" +
          "• Check if your phone is compromised\n" +
          "• Monitor for future breaches\n\n" +
          "Would you like to run a breach check now?"
      }
    ]
  },

  phishing: {
    keywords: ['phishing', 'link', 'click', 'suspicious', 'email', 'fake website'],
    responses: [
      {
        match: /is this (link|website|url|email) safe/i,
        response: () =>
          "How to check if a link is safe:\n\n" +
          "🔍 URL CHECKLIST:\n" +
          "• Look for HTTPS (padlock)\n" +
          "• Check domain spelling (sbi-secure.com vs sbi.com)\n" +
          "• Avoid shortened URLs (bit.ly, tinyurl)\n" +
          "• Don't click links in unexpected messages\n\n" +
          "⚠️ SUSPICIOUS SIGNS:\n" +
          "• Misspelled brand names\n" +
          "• Too many hyphens\n" +
          "• Strange TLDs (.xyz, .top, .work)\n" +
          "• Urgency to click immediately"
      }
    ]
  },

  investment_fraud: {
    keywords: ['investment', 'stock', 'crypto', 'trading', 'guaranteed', 'return'],
    responses: [
      {
        match: /(invest|stock|crypto).*(safe|genuine|legit)/i,
        response: () =>
          "Investment fraud is rising! Here's how to stay safe:\n\n" +
          "🚨 RED FLAGS:\n" +
          "• 'Guaranteated returns'\n" +
          "• 'Insider tips' or 'sure shots'\n" +
          "• Pressure to invest quickly\n" +
          "• Unregistered advisors\n" +
          "• Crypto schemes promising high returns\n\n" +
          "✅ SAFE INVESTING:\n" +
          "• Use SEBI registered platforms\n" +
          "• Never share trading credentials\n" +
          "• Verify before investing\n" +
          "• If it sounds too good to be true..."
      }
    ]
  },

  general: {
    keywords: [],
    responses: [
      {
        match: /.*/,
        response: () =>
          "I'm here to help you stay safe from scams! Here's what I can help with:\n\n" +
          "🔍 VERIFY:\n" +
          "• Is a call or message a scam?\n" +
          "• Is a UPI payment safe?\n" +
          "• Is a website or link safe?\n\n" +
          "🛡️ PROTECT:\n" +
          "• Password security\n" +
          "• Data breach checks\n" +
          "• How to avoid common scams\n\n" +
          "Just ask me anything about fraud, scams, or security!\n\n" +
          "Examples:\n" +
          "• 'Is this message from HDFC real?'\n" +
          "• 'How to check if a UPI ID is safe?'\n" +
          "• 'I got a call asking for OTP, is it safe?'"
      }
    ]
  }
};

// ============================================
// GUARDIAN AI CLASS
// ============================================

export class GuardianAI {
  private conversationHistory: Map<string, Array<{role: string; content: string}>> = new Map();

  /**
   * Process a user query
   */
  processQuery(userId: string, question: string, category?: GuardianCategory): GuardianResponse {
    const queryId = `q_${uuidv4().slice(0, 8)}`;

    // Add to conversation history
    const history = this.conversationHistory.get(userId) || [];
    history.push({ role: 'user', content: question });

    // Detect category if not provided
    const detectedCategory = category || this.detectCategory(question);

    // Generate response
    const response = this.generateResponse(detectedCategory, question, history);

    // Add to history
    history.push({ role: 'assistant', content: response.answer });
    this.conversationHistory.set(userId, history.slice(-10)); // Keep last 10 messages

    return {
      queryId,
      answer: response.answer,
      confidence: response.confidence,
      riskLevel: response.riskLevel,
      sources: response.sources,
      recommendations: response.recommendations,
      relatedQuestions: this.getRelatedQuestions(detectedCategory)
    };
  }

  /**
   * Detect query category
   */
  private detectCategory(question: string): GuardianCategory {
    const lowerQuestion = question.toLowerCase();

    const categoryKeywords: Record<GuardianCategory, string[]> = {
      scam_check: ['scam', 'fraud', 'fake', 'genuine', 'legit', 'real', 'trust', 'safe', 'call', 'message'],
      upi_safety: ['upi', 'payment', 'pay', 'transaction', 'transfer', 'send money', 'merchant', 'qr'],
      password_security: ['password', 'change', 'hack', 'breach', 'compromised', 'leak', 'cracked'],
      phishing: ['phishing', 'link', 'click', 'website', 'url', 'suspicious', 'email'],
      investment_fraud: ['investment', 'stock', 'crypto', 'trading', 'guaranteed', 'return', 'share', 'mutual fund'],
      general: []
    };

    let maxScore = 0;
    let detectedCategory: GuardianCategory = 'general';

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowerQuestion.includes(keyword)) {
          score++;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        detectedCategory = cat as GuardianCategory;
      }
    }

    return detectedCategory;
  }

  /**
   * Generate response based on category
   */
  private generateResponse(
    category: GuardianCategory,
    question: string,
    history: Array<{role: string; content: string}>
  ): { answer: string; confidence: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; sources?: string[]; recommendations: string[] } {

    const templates = RESPONSE_TEMPLATES[category] || RESPONSE_TEMPLATES.general;

    // Find matching response template
    for (const template of templates.responses) {
      const match = question.match(template.match);
      if (match) {
        const responseText = typeof template.response === 'function'
          ? template.response(match)
          : template.response;

        return {
          answer: responseText,
          confidence: 0.85,
          riskLevel: 'LOW',
          recommendations: this.getRecommendationsForCategory(category)
        };
      }
    }

    // Default response from general category
    const defaultResponse = RESPONSE_TEMPLATES.general.responses[0].response();
    return {
      answer: defaultResponse,
      confidence: 0.6,
      riskLevel: 'LOW',
      recommendations: this.getRecommendationsForCategory(category)
    };
  }

  /**
   * Get recommendations for category
   */
  private getRecommendationsForCategory(category: GuardianCategory): string[] {
    const recommendations: Record<GuardianCategory, string[]> = {
      scam_check: [
        'When in doubt, hang up and verify',
        'Never share OTP with anyone',
        'Use CorpID Shield to scan suspicious numbers'
      ],
      upi_safety: [
        'Always verify merchant before paying',
        'Use the UPI verification feature in CorpID Shield',
        'Never pay to receive money'
      ],
      password_security: [
        'Use unique passwords for each account',
        'Enable 2FA wherever possible',
        'Use a password manager'
      ],
      phishing: [
        'Never click suspicious links',
        'Verify URLs before entering credentials',
        'Report phishing attempts'
      ],
      investment_fraud: [
        'Only use SEBI registered platforms',
        'Never share trading credentials',
        'If it sounds too good to be true, it probably is'
      ],
      general: [
        'Stay vigilant against scams',
        'Use CorpID Shield for real-time protection',
        'Report suspicious activity immediately'
      ]
    };

    return recommendations[category];
  }

  /**
   * Get related questions
   */
  private getRelatedQuestions(category: GuardianCategory): string[] {
    const related: Record<GuardianCategory, string[]> = {
      scam_check: [
        'How to identify bank scam calls?',
        'Is this message from HDFC real?',
        'What to do if I shared OTP?'
      ],
      upi_safety: [
        'How to verify a UPI ID before paying?',
        'Common UPI scams in India',
        'How does QR code scam work?'
      ],
      password_security: [
        'How to check if my password is leaked?',
        'Best password manager in India?',
        'How to enable 2FA?'
      ],
      phishing: [
        'How to identify fake websites?',
        'What is phishing attack?',
        'How to report phishing?'
      ],
      investment_fraud: [
        'How to verify investment platform?',
        'SEBI registered advisors list',
        'Common investment scams in India'
      ],
      general: [
        'How to report a scam?',
        'Cyber crime helpline number',
        'How to protect my identity?'
      ]
    };

    return related[category];
  }

  /**
   * Clear conversation history
   */
  clearHistory(userId: string): void {
    this.conversationHistory.delete(userId);
  }

  /**
   * Get conversation history
   */
  getHistory(userId: string): Array<{role: string; content: string}> {
    return this.conversationHistory.get(userId) || [];
  }
}

// Export singleton
export const guardianAI = new GuardianAI();
