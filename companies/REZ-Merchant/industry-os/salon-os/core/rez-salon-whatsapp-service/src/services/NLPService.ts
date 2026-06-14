export interface ParsedIntent {
  intent: string;
  confidence: number;
  entities: {
    service?: string[];
    date?: string[];
    time?: string[];
    stylist?: string[];
    action?: string[];
    price?: number[];
    duration?: number[];
  };
  rawQuery: string;
  suggestedResponse?: string;
}

interface IntentPattern {
  patterns: RegExp[];
  intent: string;
  extractors: {
    service?: string[];
    date?: string[];
    time?: string[];
    stylist?: string[];
    action?: string[];
  };
}

const SERVICE_KEYWORDS = [
  'haircut', 'hair cut', 'styling', 'color', 'colour', 'highlights', 'balayage',
  'keratin', 'treatment', 'mask', 'shampoo', 'blowout', 'blow dry', 'trim',
  'shave', 'beard', 'facial', 'cleanup', 'threading', 'waxing', 'manicure',
  'pedicure', 'nail', 'makeup', 'bridal', 'massage', 'spa', 'eye brow', 'eyebrow'
];

const STYLIST_KEYWORDS = [
  'sarah', 'john', 'mike', 'emma', 'lisa', 'david', 'anna', 'jennifer',
  'senior', 'junior', 'expert', 'specialist', 'master', 'junior stylist'
];

const ACTION_KEYWORDS: Record<string, string[]> = {
  book: ['book', 'schedule', 'appointment', 'reserve', 'slot', 'check in'],
  cancel: ['cancel', 'delete', 'remove', 'undo', 'abort'],
  view: ['show', 'view', 'see', 'display', 'list', 'history', 'past'],
  confirm: ['confirm', 'yes', 'sure', 'ok', 'proceed', 'done', 'complete'],
  modify: ['change', 'modify', 'update', 'reschedule', 'move'],
  pay: ['pay', 'payment', 'checkout', 'bill', 'invoice', 'amount'],
  help: ['help', 'menu', 'options', 'what can', 'available', 'services'],
  availability: ['available', 'availability', 'free', 'open', 'slots', 'when'],
  reminder: ['remind', 'reminder', 'alert', 'notify'],
  recommend: ['recommend', 'suggest', 'suggestion', 'best', 'popular', 'trending'],
  price: ['price', 'cost', 'charge', 'fee', 'worth', 'expensive', 'cheap', 'how much']
};

const TIME_PATTERNS = [
  /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
  /\b(9|10|11|12|1|2|3|4|5)\s*(am|pm)\b/i,
  /\b(morning|afternoon|evening|noon)\b/i,
  /\b(next\s+(week|month|tomorrow|today))\b/i
];

const DATE_PATTERNS = [
  /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/,
  /\b((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*)\b/i,
  /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(next\s+(week|month))\b/i
];

export class NLPService {
  private patterns: IntentPattern[];

  constructor() {
    this.patterns = this.initializePatterns();
  }

  private initializePatterns(): IntentPattern[] {
    return [
      {
        patterns: [
          /book\s+(.+)/i,
          /(?:i\s+want\s+to|i'd\s+like\s+to)\s+book\s+(.+)/i,
          /(?:schedule|make)\s+(?:an?\s+)?(.+)/i
        ],
        intent: 'book',
        extractors: { service: SERVICE_KEYWORDS }
      },
      {
        patterns: [
          /cancel\s+(.+)/i,
          /(?:want\s+to\s+)?cancel\s+(?:my\s+)?(.+)/i
        ],
        intent: 'cancel',
        extractors: { service: SERVICE_KEYWORDS }
      },
      {
        patterns: [
          /view\s+(?:my\s+)?(?:past\s+)?(?:appointments|bookings|history)/i,
          /(?:show|list)\s+(?:my\s+)?(?:past\s+)?(?:appointments|bookings)/i,
          /(?:what\s+)?(?:is\s+)?(?:my\s+)?(?:past\s+)?appointments/i
        ],
        intent: 'view_history',
        extractors: {}
      },
      {
        patterns: [
          /(?:is|are)\s+(.+)\s+(?:available|free)/i,
          /(?:check\s+)?availability\s+(?:for|of)\s+(.+)/i,
          /(?:when|what\s+time)\s+is\s+(.+)\s+(?:available|free)/i
        ],
        intent: 'availability',
        extractors: { service: SERVICE_KEYWORDS }
      },
      {
        patterns: [
          /(?:what|how)\s+(?:is\s+)?(?:the\s+)?price\s+(?:of|for)?\s*(.+)?/i,
          /(?:how\s+much\s+)?(?:does|cost|charge)\s+(.+)/i
        ],
        intent: 'price',
        extractors: { service: SERVICE_KEYWORDS }
      },
      {
        patterns: [
          /recommend\s+(?:me\s+)?(?:a|some)?(.+)/i,
          /(?:what|which)\s+(?:is|are)\s+(?:the\s+)?best\s+(.+)/i,
          /(?:suggest|popular|trending)\s+(.+)/i
        ],
        intent: 'recommend',
        extractors: { service: SERVICE_KEYWORDS }
      },
      {
        patterns: [
          /(?:send|pay)\s+(?:me\s+)?(?:the\s+)?(?:payment\s+)?link/i,
          /(?:i\s+want\s+to\s+)?pay\s+(?:now|online)/i,
          /checkout/i
        ],
        intent: 'payment',
        extractors: {}
      },
      {
        patterns: [
          /remind\s+(?:me\s+)?(?:about\s+)?(?:my\s+)?(.+)/i,
          /(?:set|add)\s+(?:a\s+)?reminder\s+(?:for|about)\s+(.+)/i
        ],
        intent: 'reminder',
        extractors: { date: DATE_PATTERNS.map(p => p.source), time: TIME_PATTERNS.map(p => p.source) }
      },
      {
        patterns: [
          /(?:confirm|yes|okay|ok|proceed|sure)\b/i,
          /(?:sounds\s+)?good/i
        ],
        intent: 'confirm',
        extractors: {}
      },
      {
        patterns: [
          /(?:cancel|no|nope|nevermind|never\s+mind)\b/i,
          /change\s+(?:my\s+)?mind/i
        ],
        intent: 'cancel',
        extractors: {}
      },
      {
        patterns: [
          /(?:what|which)\s+(?:services?|treatments?|options?)\s+(?:do\s+you\s+have|are\s+available)/i,
          /menu/i,
          /help/i,
          /(?:what\s+)?can\s+(?:you|i)\s+(?:do|help\s+with)/i
        ],
        intent: 'help',
        extractors: {}
      },
      {
        patterns: [
          /(?:stylist|expert|hairdresser|beautician)\s+(?:named?\s+)?(.+)/i,
          /prefer\s+(?:a\s+)?(.+)\s+stylist/i,
          /with\s+(.+)\s+stylist/i
        ],
        intent: 'select_stylist',
        extractors: { stylist: STYLIST_KEYWORDS }
      },
      {
        patterns: [
          /(?:check|see|show)\s+(?:appointment|booking|schedule)\s+(?:for|on)?\s*(.+)/i
        ],
        intent: 'check_booking',
        extractors: { date: DATE_PATTERNS.map(p => p.source) }
      }
    ];
  }

  parse(query: string): ParsedIntent {
    const normalizedQuery = query.trim().toLowerCase();
    let bestMatch: { intent: string; confidence: number; matchedPattern?: RegExp } = {
      intent: 'unknown',
      confidence: 0
    };

    for (const pattern of this.patterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(normalizedQuery)) {
          const confidence = this.calculateConfidence(regex, normalizedQuery);
          if (confidence > bestMatch.confidence) {
            bestMatch = { intent: pattern.intent, confidence, matchedPattern: regex };
          }
        }
      }
    }

    if (bestMatch.confidence === 0) {
      bestMatch = this.detectIntentByKeywords(normalizedQuery);
    }

    return {
      intent: bestMatch.intent,
      confidence: bestMatch.confidence,
      entities: this.extractEntities(normalizedQuery),
      rawQuery: query,
      suggestedResponse: this.generateSuggestedResponse(bestMatch.intent)
    };
  }

  private calculateConfidence(pattern: RegExp, query: string): number {
    const match = query.match(pattern);
    if (!match) return 0;

    const matchLength = match[0].length;
    const queryLength = query.length;

    let confidence = matchLength / queryLength;

    if (queryLength > 20) confidence *= 0.9;

    if (/\b(please|kindly|would\s+like)\b/i.test(query)) confidence += 0.1;

    return Math.min(confidence, 1);
  }

  private detectIntentByKeywords(query: string): { intent: string; confidence: number } {
    const actionScores: Record<string, number> = {};

    for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          score += 0.3;
        }
      }
      if (score > 0) {
        actionScores[action] = score;
      }
    }

    if (Object.keys(actionScores).length === 0) {
      return { intent: 'unknown', confidence: 0.3 };
    }

    const bestAction = Object.entries(actionScores).reduce((a, b) =>
      b[1] > a[1] ? b : a
    );

    return { intent: bestAction[0], confidence: Math.min(bestAction[1], 0.8) };
  }

  private extractEntities(query: string): ParsedIntent['entities'] {
    const entities: ParsedIntent['entities'] = {};

    entities.service = SERVICE_KEYWORDS.filter(keyword =>
      query.includes(keyword.toLowerCase())
    );

    const dateMatches: string[] = [];
    for (const pattern of DATE_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        dateMatches.push(match[0]);
      }
    }
    if (dateMatches.length > 0) {
      entities.date = dateMatches;
    }

    const timeMatches: string[] = [];
    for (const pattern of TIME_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        timeMatches.push(match[0]);
      }
    }
    if (timeMatches.length > 0) {
      entities.time = timeMatches;
    }

    entities.stylist = STYLIST_KEYWORDS.filter(keyword =>
      query.includes(keyword.toLowerCase())
    );

    for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          if (!entities.action) entities.action = [];
          if (!entities.action.includes(action)) {
            entities.action.push(action);
          }
          break;
        }
      }
    }

    const priceMatch = query.match(/\$?\d+(?:\.\d{2})?/);
    if (priceMatch) {
      entities.price = [parseFloat(priceMatch[0].replace('$', ''))];
    }

    const durationMatch = query.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      const minutes = unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 : value;
      entities.duration = [minutes];
    }

    return entities;
  }

  private generateSuggestedResponse(intent: string): string {
    const responses: Record<string, string> = {
      book: 'I can help you book an appointment. What service would you like?',
      cancel: 'I\'ll help you cancel. Please provide your booking details.',
      view_history: 'Here are your past appointments:',
      availability: 'Let me check the availability for you.',
      price: 'The pricing depends on the service. Which treatment are you interested in?',
      recommend: 'Based on your preferences, I recommend:',
      payment: 'I\'ll send you the payment link.',
      reminder: 'I\'ll set up a reminder for your appointment.',
      confirm: 'Great! Let me confirm your booking.',
      cancel_booking: 'Your booking has been cancelled.',
      help: 'Here\'s how I can help you:\n1. Book appointments\n2. Check availability\n3. View past appointments\n4. Get recommendations\n5. Pay online',
      select_stylist: 'Let me find a stylist for you.',
      check_booking: 'Let me check your booking status.',
      unknown: 'I\'m not sure I understand. Type "help" to see available options.'
    };

    return responses[intent] || responses.unknown;
  }

  normalizeDate(dateStr: string): string | null {
    const today = new Date();
    const normalized = dateStr.toLowerCase().trim();

    if (normalized === 'today') {
      return today.toISOString().split('T')[0];
    }

    if (normalized === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    const dayMap: Record<string, number> = {
      'sunday': 0, 'sun': 0,
      'monday': 1, 'mon': 1,
      'tuesday': 2, 'tue': 2,
      'wednesday': 3, 'wed': 3,
      'thursday': 4, 'thu': 4,
      'friday': 5, 'fri': 5,
      'saturday': 6, 'sat': 6
    };

    for (const [day, value] of Object.entries(dayMap)) {
      if (normalized.includes(day)) {
        const targetDay = new Date(today);
        const currentDay = today.getDay();
        let daysUntil = value - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        targetDay.setDate(today.getDate() + daysUntil);
        return targetDay.toISOString().split('T')[0];
      }
    }

    const dateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]) - 1;
      const day = parseInt(dateMatch[2]);
      let year = parseInt(dateMatch[3]);
      if (year < 100) year += 2000;
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    }

    return null;
  }

  normalizeTime(timeStr: string): string | null {
    const normalized = timeStr.toLowerCase().trim();

    const timeMatch = normalized.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2];
      const period = timeMatch[3]?.toLowerCase();

      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    const simpleMatch = normalized.match(/(9|10|11|12|1|2|3|4|5)\s*(am|pm)/i);
    if (simpleMatch) {
      let hours = parseInt(simpleMatch[1]);
      const period = simpleMatch[2].toLowerCase();

      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:00`;
    }

    const periodMap: Record<string, string> = {
      'morning': '10:00',
      'afternoon': '14:00',
      'evening': '18:00',
      'noon': '12:00'
    };

    for (const [period, time] of Object.entries(periodMap)) {
      if (normalized.includes(period)) {
        return time;
      }
    }

    return null;
  }
}

export const nlpService = new NLPService();
