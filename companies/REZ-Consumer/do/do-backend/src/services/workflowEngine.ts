import { v4 as uuidv4 } from 'uuid';
import { intentParser, DoIntent, ParsedIntent } from './intentParser.js';
import { responseGenerator } from './responseGenerator.js';
import { mockDiscovery, mockWallet, mockLoyalty, mockBookings } from './mockServices.js';
import { logger } from '../utils/logger.js';

interface Context {
  sessionId: string;
  userId?: string;
  location?: { lat: number; lng: number };
  session?;
}

interface DoMessage {
  id: string;
  type: 'text' | 'card' | 'reward' | 'suggestion';
  content: string;
  data?;
}

interface WorkflowResult {
  messages: DoMessage[];
  suggestions: string[];
}

export class WorkflowEngine {
  async execute(input: string, context: Context): Promise<WorkflowResult> {
    // Parse intent
    const parsedIntent = intentParser.parse(input);

    logger.debug('Parsed intent', {
      intent: parsedIntent.intent,
      confidence: parsedIntent.confidence,
      entities: parsedIntent.entities,
    });

    // Route to appropriate handler
    switch (parsedIntent.intent) {
      case DoIntent.GREETING:
        return this.handleGreeting(parsedIntent, context);

      case DoIntent.HELP:
        return this.handleHelp(parsedIntent, context);

      case DoIntent.MOOD_DISCOVERY:
      case DoIntent.BROWSE:
      case DoIntent.SEARCH:
        return this.handleDiscovery(parsedIntent, context);

      case DoIntent.BOOK:
      case DoIntent.RESERVE:
        return this.handleBooking(parsedIntent, context);

      case DoIntent.CHECK_BALANCE:
      case DoIntent.CHECK_KARMA:
        return this.handleWalletCheck(parsedIntent, context);

      case DoIntent.CHECK_BOOKINGS:
        return this.handleBookingsList(parsedIntent, context);

      case DoIntent.DIRECTIONS:
        return this.handleDirections(parsedIntent, context);

      case DoIntent.PAY:
        return this.handlePayment(parsedIntent, context);

      default:
        return this.handleUnknown(parsedIntent, context);
    }
  }

  private async handleGreeting(intent: ParsedIntent, context: Context): Promise<WorkflowResult> {
    const greetings = [
      "Hey! I'm Do, your AI assistant. What can I do for you today?",
      "Hi there! Ready to help you out. What are you looking for?",
      "Hello! Just tell me what you need — I'll take care of it.",
    ];

    // NOTE: Using Math.random() here is acceptable for UI greeting selection
    // as it only selects from predefined greetings, not for security purposes.
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    return {
      messages: [
        {
          id: uuidv4(),
          type: 'text',
          content: greeting,
        },
      ],
      suggestions: [
        "Book dinner for 2",
        "Show my coins",
        "I'm bored tonight",
        "Find nearby cafes",
      ],
    };
  }

  private async handleHelp(intent: ParsedIntent, context: Context): Promise<WorkflowResult> {
    const helpText = `Here's what I can do:

🍽️ **Book things** — restaurants, trials, events
🔍 **Discover** — find places near you
💰 **Check wallet** — see your coins and karma
📅 **Manage bookings** — view or cancel reservations
🎁 **Earn rewards** — every action earns coins

Just tell me what you want!`;

    return {
      messages: [
        {
          id: uuidv4(),
          type: 'text',
          content: helpText,
        },
      ],
      suggestions: [
        "Book dinner",
        "Show my karma",
        "Find nearby places",
      ],
    };
  }

  private async handleDiscovery(intent: ParsedIntent, context: Context): Promise<WorkflowResult> {
    const { entities, intent: intentType } = intent;

    // Get mood from entities
    const mood = entities.mood;
    const query = entities.venue?.name;

    // Fetch from discovery service
    const venues = await mockDiscovery.search({
      query,
      mood,
      location: context.location,
      limit: 5,
    });

    if (venues.length === 0) {
      return {
        messages: [
          {
            id: uuidv4(),
            type: 'text',
            content: "Couldn't find anything matching that. Want to try a different search?",
          },
        ],
        suggestions: [
          "Show trending nearby",
          "Find restaurants",
          "I'm bored",
        ],
      };
    }

    // Create entity cards
    const cards = venues.map((venue) => ({
      id: uuidv4(),
      type: 'card' as const,
      content: venue.name,
      data: {
        id: venue.id,
        type: venue.type,
        name: venue.name,
        image: venue.image,
        subtitle: venue.cuisine || venue.category,
        distance: venue.distance,
        rating: venue.rating,
        reviewCount: venue.reviewCount,
        priceRange: venue.priceRange,
        openNow: venue.openNow,
        karmaDiscount: venue.karmaDiscount,
        coinEarning: venue.coinEarning,
      },
    }));

    const introText = mood
      ? `Based on your mood, here are some ideas:`
      : query
      ? `Found some options for "${query}":`
      : `Here are some places near you:`;

    return {
      messages: [
        {
          id: uuidv4(),
          type: 'text',
          content: introText,
        },
        ...cards,
      ],
      suggestions: [
        "Show more options",
        "Book the first one",
        "Surprise me",
      ],
    };
  }

  private async handleBooking(intent: ParsedIntent, context: Context): Promise<WorkflowResult> {
    const { entities } = intent;
    const { venue, time, partySize } = entities;

    // If venue is specified, book it
    if (venue?.id) {
      const booking = await mockBookings.createBooking({
        entityId: venue.id,
        entityName: venue.name || 'this place',
        dateTime: time?.specific || new Date(),
        partySize: partySize || 2,
        userId: context.userId,
      });

      // Get karma discount
      const karmaDiscount = await mockLoyalty.calculateDiscount(
        context.userId,
        venue.id
      );

      // Calculate rewards
      const rewards = await mockLoyalty.calculateRewards({
        type: 'booking',
        amount: booking.price,
        userId: context.userId,
      });

      return {
        messages: [
          {
            id: uuidv4(),
            type: 'text',
            content: `✓ Booking confirmed!`,
          },
          {
            id: uuidv4(),
            type: 'card',
            content: 'Booking Details',
            data: {
              id: booking.id,
              confirmationCode: booking.confirmationCode,
              entityName: booking.entityName,
              dateTime: booking.dateTime,
              partySize: booking.partySize,
              karmaDiscount: karmaDiscount.amount,
            },
          },
          {
            id: uuidv4(),
            type: 'reward',
            content: 'Rewards earned!',
            data: {
              coins: rewards.coins,
              karma: rewards.karma,
            },
          },
        ],
        suggestions: [
          "Show QR code",
          "Get directions",
          "Add to calendar",
        ],
      };
    }

    // No venue specified - do discovery first
    return this.handleDiscovery(intent, context);
  }

  private async handleWalletCheck(intent: ParsedIntent, context: Context): Promise<WorkflowResult> {
    const wallet = await mockWallet.getWallet(context.userId);
    const karma = await mockLoyalty.getStatus(context.userId);

    const content = `Here's your status:

💰 **${wallet.coins.toLocaleString()} coins**
⭐ **${karma.tier}** — ${karma.points} karma points

${karma.progress}% to ${karma.nextTier}`;

    return {
      messages: [
        {
          id: uuidv4(),
          type: 'text',
          content,
        },
      ],
      suggestions: [
        "View transactions",
        "Earn more coins",
        "Show tier benefits",
      ],
    };
  }

  private async handleBookingsList(intent: ParsedIntent, context: Context): Promise<WorkflowResult> {
    const bookings = await mockBookings.getBookings(context.userId);

    if (bookings.length === 0) {
      return {
        messages: [
          {
            id: uuidv4(),
            type: 'text',
            content: "You don't have unknown upcoming bookings. Want to book something?",
          },
        ],
        suggestions: [
          "Find restaurants",
          "Book a trial",
          "Show nearby",
        ],
      };
    }

    const cards = bookings.map((booking) => ({
      id: uuidv4(),
      type: 'card' as const,
      content: booking.entityName,
      data: {
        id: booking.id,
        type: 'booking',
        name: booking.entityName,
        subtitle: new Date(booking.dateTime).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        status: booking.status,
        confirmationCode: booking.confirmationCode,
      },
    }));

    return {
      messages: [
        {
          id: uuidv4(),
          type: 'text',
          content: 'Your upcoming bookings:',
        },
        ...cards,
      ],
      suggestions: [
        "View QR code",
        "Cancel booking",
        "Book another",
      ],
    };
  }

  private async handleDirections(intent: ParsedIntent, context: Context): Promise<WorkflowResult> {
    const { venue } = intent.entities;

    if (!venue?.id) {
      return {
        messages: [
          {
            id: uuidv4(),
            type: 'text',
            content: "Which place would you like directions to?",
          },
        ],
        suggestions: [
          "Show nearby places",
          "Find restaurants",
        ],
      };
    }

    return {
      messages: [
        {
          id: uuidv4(),
          type: 'text',
          content: `Opening directions to ${venue.name}...`,
        },
      ],
      suggestions: [],
    };
  }

  private async handlePayment(intent: ParsedIntent, context: Context): Promise<WorkflowResult> {
    const wallet = await mockWallet.getWallet(context.userId);

    return {
      messages: [
        {
          id: uuidv4(),
          type: 'text',
          content: `Your wallet has ${wallet.coins.toLocaleString()} coins. Ready to pay?`,
        },
      ],
      suggestions: [
        "Yes, pay now",
        "Show my balance",
      ],
    };
  }

  private async handleUnknown(intent: ParsedIntent, context: Context): Promise<WorkflowResult> {
    return {
      messages: [
        {
          id: uuidv4(),
          type: 'text',
          content: "I'm not sure I understand. Try saying 'help' to see what I can do, or try one of these:",
        },
      ],
      suggestions: [
        "Book dinner",
        "Show my karma",
        "Find nearby places",
        "I'm bored tonight",
      ],
    };
  }
}

export const workflowEngine = new WorkflowEngine();
