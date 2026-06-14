// Response Generator - AI personality and responses

export class ResponseGenerator {
  private personality = {
    name: 'Do',
    tone: 'helpful, concise, slightly playful',
    emoji: ['🎉', '✨', '📍', '✅', '💰', '⭐', '🔥', '👍'],
  };

  greeting(): string {
    const greetings = [
      `Hey! I'm ${this.personality.name}, your AI assistant. What can I do for you?`,
      `Hi there! Ready to help you out. What are you looking for?`,
      `Hello! Just tell me what you need — I'll take care of it.`,
    ];
    return this.randomPick(greetings);
  }

  confirmation(action: string): string {
    const confirmations = [
      `Done! ${action}`,
      `All set! ${action}`,
      `✓ ${action}`,
      `${action} completed!`,
    ];
    return this.randomPick(confirmations);
  }

  reward(coins: number, karma: number): string {
    let response = '';
    if (coins > 0) {
      response += `+${coins} coins earned! 🎉`;
    }
    if (karma > 0) {
      if (response) response += ' ';
      response += `+${karma} karma ⭐`;
    }
    return response;
  }

  error(reason: string): string {
    const errors = [
      `Hmm, something went wrong. ${reason}`,
      `Oops! ${reason}`,
      `Sorry, ${reason}. Want to try again?`,
    ];
    return this.randomPick(errors);
  }

  suggestion(action: string): string {
    return `Want me to ${action}?`;
  }

  noResults(category?: string): string {
    const responses = [
      "Couldn't find anything matching that. Want to try something different?",
      'Hmm, no results. Maybe try another search?',
      "Nothing here yet. Want to explore nearby instead?",
    ];
    return this.randomPick(responses);
  }

  // Format booking confirmation
  formatBookingConfirmation(booking): string {
    return `✓ Booking confirmed!

📍 ${booking.venue}
📅 ${this.formatDate(booking.dateTime)}
👥 ${booking.partySize} people
💰 ${booking.priceRange}

Confirmation: ${booking.confirmationCode}`;
  }

  // Format wallet display
  formatWallet(wallet, karma): string {
    return `💰 Your Wallet

**${wallet.coins.toLocaleString()}** coins
**${karma.tier}** (${karma.points} points)

${karma.progress}% to ${karma.nextTier}`;
  }

  // Format entity card
  formatEntity(entity): string {
    let text = `**${entity.name}**\n`;
    text += `${entity.distance} • ${entity.rating}★\n`;

    if (entity.karmaDiscount) {
      text += `💰 ${entity.karmaDiscount}% off with karma\n`;
    }

    if (entity.openNow !== undefined) {
      text += entity.openNow ? '🟢 Open now\n' : '🔴 Closed\n';
    }

    return text;
  }

  // NOTE: Using Math.random() here is acceptable for UI text selection
  // as it only selects from predefined templates, not for security purposes.
  private randomPick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

export const responseGenerator = new ResponseGenerator();
