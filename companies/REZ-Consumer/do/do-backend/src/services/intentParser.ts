// Intent Parser - Classifies user messages

export enum DoIntent {
  GREETING = 'greeting',
  HELP = 'help',
  MOOD_DISCOVERY = 'mood_discovery',
  BROWSE = 'browse',
  SEARCH = 'search',
  BOOK = 'book',
  RESERVE = 'reserve',
  CHECK_BALANCE = 'check_balance',
  CHECK_KARMA = 'check_karma',
  CHECK_BOOKINGS = 'check_bookings',
  CANCEL = 'cancel',
  MODIFY = 'modify',
  DIRECTIONS = 'directions',
  REMINDER = 'reminder',
  PAY = 'pay',
  ORDER = 'order',
  UNKNOWN = 'unknown',
}

export interface ParsedIntent {
  intent: DoIntent;
  confidence: number;
  entities: ExtractedEntities;
  suggestedActions: string[];
}

export interface ExtractedEntities {
  venue?: {
    id?: string;
    name?: string;
    type?: string;
  };
  time?: {
    when: 'now' | 'today' | 'tomorrow' | 'specific';
    specific?: Date;
  };
  partySize?: number;
  location?: {
    lat: number;
    lng: number;
    description?: string;
  };
  amount?: number;
  mood?: string;
}

// Intent patterns
const INTENT_PATTERNS: Record<DoIntent, RegExp[]> = {
  [DoIntent.GREETING]: [
    /^(hi|hey|hello|yo|sup|howdy|greetings)/i,
    /^good\s+(morning|afternoon|evening|day)/i,
  ],

  [DoIntent.HELP]: [
    /^(help|what can you do|how do|commands?|features?)/i,
    /^(what|how)\s+(can|could)\s+(you|i)/i,
    /^(show|list)\s+(me\s+)?(commands?|help|options?)/i,
  ],

  [DoIntent.MOOD_DISCOVERY]: [
    /i'?m\s+(bored|tired|stressed|hungry)/i,
    /want\s+to\s+(relax|celebrate|have\s+fun|explore)/i,
    /suggest\s+(something|what\s+to\s+do)/i,
    /(what|where)\s+should\s+i\s+(do|go|eat|try)/i,
    /(feeling|feel)\s+(like\s+)?(.+)/i,
    /surprise\s+(me|us)/i,
    /(i\s+)?(need|want)\s+(something|a|an)/i,
  ],

  [DoIntent.BROWSE]: [
    /show\s+(me\s+)?(.+)/i,
    /what'?s?\s+(nearby|around|available|there)/i,
    /explore/i,
    /discover/i,
    /find\s+(some|unknown|a)\s+(places?|options?)/i,
  ],

  [DoIntent.SEARCH]: [
    /search\s+(for\s+)?(.+)/i,
    /look\s+(for|up)\s+(.+)/i,
    /find\s+(.+)/i,
  ],

  [DoIntent.BOOK]: [
    /book\s+(.+)/i,
    /reserve\s+(.+)/i,
    /make\s+a\s+(reservation|booking)/i,
    /schedule\s+(.+)/i,
  ],

  [DoIntent.RESERVE]: [
    /reserve\s+(.+)/i,
    /book\s+(.+)/i,
    /get\s+(.+)/i,
  ],

  [DoIntent.CHECK_BALANCE]: [
    /how\s+much\s+(coins?|money|balance)/i,
    /check\s+(my\s+)?balance/i,
    /show\s+(me\s+)?(my\s+)?(coins?|balance)/i,
    /my\s+(coins?|money|balance)/i,
  ],

  [DoIntent.CHECK_KARMA]: [
    /show\s+(me\s+)?(my\s+)?karma/i,
    /what(?:\'?s)?\s+(my\s+)?(tier|karma\s+status)/i,
    /karma\s+(status|points?|tier)/i,
    /tier\s+(status|level)/i,
  ],

  [DoIntent.CHECK_BOOKINGS]: [
    /my\s+bookings?/i,
    /what\s+(did\s+i\s+)?book/i,
    /booking\s+history/i,
    /upcoming\s+(bookings?|reservations?)/i,
    /show\s+(me\s+)?(my\s+)?(bookings?|reservations?)/i,
  ],

  [DoIntent.CANCEL]: [
    /cancel\s+(.+)/i,
    /remove\s+(.+)/i,
    /delete\s+(.+)/i,
  ],

  [DoIntent.MODIFY]: [
    /change\s+(.+)/i,
    /modify\s+(.+)/i,
    /update\s+(.+)/i,
    /reschedule/i,
  ],

  [DoIntent.DIRECTIONS]: [
    /directions?\s+(to\s+)?(.+)/i,
    /how\s+do\s+i\s+get\s+(there|to\s+.+)/i,
    /where\s+is\s+(.+)/i,
    /navigate\s+to\s+(.+)/i,
    /maps?/i,
    /google\s+maps/i,
  ],

  [DoIntent.REMINDER]: [
    /remind\s+(me\s+)?(.+)/i,
    /set\s+(a\s+)?reminder/i,
    /alert\s+(me\s+)?(.+)/i,
  ],

  [DoIntent.PAY]: [
    /pay\s+(for\s+)?(.+)/i,
    /checkout/i,
    /complete\s+(the\s+)?payment/i,
    /charge\s+(.+)/i,
  ],

  [DoIntent.ORDER]: [
    /order\s+(.+)/i,
    /get\s+(.+)/i,
    /buy\s+(.+)/i,
  ],

  [DoIntent.UNKNOWN]: [],
};

// Mood keywords
const MOOD_KEYWORDS: Record<string, string> = {
  'bored': 'bored',
  'tired': 'relax',
  'stressed': 'relax',
  'hungry': 'food',
  'relax': 'relax',
  'celebrate': 'celebrate',
  'have fun': 'adventure',
  'fun': 'adventure',
  'explore': 'adventure',
  'date': 'date',
  'romantic': 'date',
  'adventure': 'adventure',
  'new': 'adventure',
};

export class IntentParser {
  parse(input: string): ParsedIntent {
    const normalizedInput = input.toLowerCase().trim();

    // Try to match patterns
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        const match = normalizedInput.match(pattern);
        if (match) {
          return {
            intent: intent as DoIntent,
            confidence: 0.9,
            entities: this.extractEntities(normalizedInput, match),
            suggestedActions: this.getSuggestedActions(intent as DoIntent),
          };
        }
      }
    }

    // Default to search
    return {
      intent: DoIntent.SEARCH,
      confidence: 0.5,
      entities: this.extractEntities(normalizedInput, null),
      suggestedActions: this.getSuggestedActions(DoIntent.SEARCH),
    };
  }

  private extractEntities(input: string, match: RegExpMatchArray | null): ExtractedEntities {
    const entities: ExtractedEntities = {};

    // Extract party size
    const partyMatch = input.match(/(\d+)\s*(?:people|person|guests?|of\s+us)?/i);
    if (partyMatch) {
      entities.partySize = parseInt(partyMatch[1], 10);
    }

    // Extract time
    if (/now|immediately|asap/i.test(input)) {
      entities.time = { when: 'now' };
    } else if (/tonight/i.test(input)) {
      entities.time = { when: 'today' };
    } else if (/tomorrow/i.test(input)) {
      entities.time = { when: 'tomorrow' };
    } else {
      // Try to extract specific time
      const timeMatch = input.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
      if (timeMatch) {
        entities.time = {
          when: 'specific',
          specific: this.parseTime(timeMatch),
        };
      }
    }

    // Extract mood
    for (const [keyword, mood] of Object.entries(MOOD_KEYWORDS)) {
      if (input.includes(keyword)) {
        entities.mood = mood;
        break;
      }
    }

    // Extract venue name from match
    if (match && match[1]) {
      const venueName = match[1].trim();
      // Don't treat intent words as venue names
      const intentWords = ['dinner', 'lunch', 'breakfast', 'brunch', 'coffee', 'drinks', 'movies', 'spa', 'massage', 'gym', 'class', 'event', 'show', 'concert'];
      if (intentWords.some(word => venueName.includes(word))) {
        entities.venue = { name: venueName };
      }
    }

    return entities;
  }

  private parseTime(match: RegExpMatchArray): Date {
    const now = new Date();
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const meridiem = match[3]?.toLowerCase();

    if (meridiem === 'pm' && hours !== 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    now.setHours(hours, minutes, 0, 0);
    return now;
  }

  private getSuggestedActions(intent: DoIntent): string[] {
    const suggestions: Record<DoIntent, string[]> = {
      [DoIntent.GREETING]: ['Book dinner', 'Show my coins', "I'm bored"],
      [DoIntent.HELP]: ['Book something', 'Check wallet', 'Find nearby'],
      [DoIntent.MOOD_DISCOVERY]: ['Surprise me', 'Show options', 'Book one'],
      [DoIntent.BROWSE]: ['Show popular', 'Show nearby', 'Show trending'],
      [DoIntent.SEARCH]: ['Try nearby', 'Show more'],
      [DoIntent.BOOK]: ['View details', 'Change time', 'Different place'],
      [DoIntent.RESERVE]: ['View details', 'Change time'],
      [DoIntent.CHECK_BALANCE]: ['View transactions', 'Earn more'],
      [DoIntent.CHECK_KARMA]: ['View benefits', 'How to earn'],
      [DoIntent.CHECK_BOOKINGS]: ['Upcoming', 'Past bookings'],
      [DoIntent.CANCEL]: ['Confirm', 'Keep it'],
      [DoIntent.MODIFY]: ['Change details'],
      [DoIntent.DIRECTIONS]: ['Open maps', 'Share'],
      [DoIntent.REMINDER]: ['Change time', 'Cancel'],
      [DoIntent.PAY]: ['Try again', 'Different method'],
      [DoIntent.ORDER]: ['Track order', 'View menu'],
      [DoIntent.UNKNOWN]: ['Book dinner', 'Check wallet', 'Find nearby'],
    };

    return suggestions[intent] || [];
  }
}

export const intentParser = new IntentParser();
