import { Conversation, ConversationState, IConversation, IBookingDetails } from '../models/Conversation';
import { WhatsAppService } from './WhatsAppService';
import { nlpService, ParsedIntent } from './NLPService';
import axios from 'axios';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
  availableStylists: string[];
}

export interface Stylist {
  id: string;
  name: string;
  specialties: string[];
  rating: number;
  availableDates: string[];
  availableTimes: string[];
  imageUrl?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  stylistId?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  phoneNumber: string;
  service: Service;
  stylist: Stylist;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  reminderSent: boolean;
  reminderTime?: Date;
  paymentLink?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

interface SalonConfig {
  salonServiceUrl?: string;
  internalServiceToken?: string;
  reminderQueueName?: string;
  redisUrl?: string;
}

export class BookingBot {
  private whatsappService: WhatsAppService;
  private reminderQueue: Queue | null = null;
  private redis: Redis | null = null;
  private config: SalonConfig;

  private readonly GREETING_MESSAGE = `Welcome to ReZ Salon! ✂️

I'm here to help you with:
• Booking appointments
• Checking availability
• Viewing past appointments
• Stylist recommendations
• Payment links

What would you like to do today?`;

  private readonly HELP_MESSAGE = `Here's how I can help you:

📅 *Booking*
• "Book a haircut"
• "I want a facial tomorrow"
• "Schedule an appointment"

🔍 *Availability*
• "Check availability for highlights"
• "When is Sarah available?"

📋 *Appointments*
• "View my appointments"
• "Cancel my booking"

💡 *Recommendations*
• "Recommend a stylist"
• "What's popular?"

💳 *Payment*
• "Send me payment link"

Just type naturally and I'll help you out!`;

  private readonly SERVICES_CATALOG: Service[] = [
    { id: 'haircut', name: 'Haircut & Styling', category: 'hair', price: 45, duration: 45, description: 'Professional haircut with styling', availableStylists: ['sarah', 'john', 'emma'] },
    { id: 'color', name: 'Hair Coloring', category: 'hair', price: 120, duration: 120, description: 'Full color treatment', availableStylists: ['sarah', 'emma'] },
    { id: 'highlights', name: 'Highlights & Balayage', category: 'hair', price: 180, duration: 180, description: 'Partial or full highlights', availableStylists: ['sarah', 'emma'] },
    { id: 'keratin', name: 'Keratin Treatment', category: 'hair', price: 250, duration: 150, description: 'Smooth and shiny results', availableStylists: ['sarah'] },
    { id: 'facial', name: 'Facial Treatment', category: 'skin', price: 80, duration: 60, description: 'Deep cleansing facial', availableStylists: ['lisa', 'anna'] },
    { id: 'manicure', name: 'Manicure', category: 'nails', price: 35, duration: 30, description: 'Nail care and polish', availableStylists: ['jennifer', 'anna'] },
    { id: 'pedicure', name: 'Pedicure', category: 'nails', price: 45, duration: 45, description: 'Complete foot care', availableStylists: ['jennifer', 'anna'] },
    { id: 'bridal', name: 'Bridal Makeup', category: 'makeup', price: 350, duration: 180, description: 'Complete bridal styling', availableStylists: ['lisa', 'anna'] },
    { id: 'massage', name: 'Scalp Massage', category: 'spa', price: 40, duration: 30, description: 'Relaxing scalp massage', availableStylists: ['john', 'lisa'] },
    { id: 'blowout', name: 'Blowout', category: 'hair', price: 30, duration: 30, description: 'Professional blow dry styling', availableStylists: ['sarah', 'john', 'emma'] }
  ];

  private readonly STYLISTS: Stylist[] = [
    { id: 'sarah', name: 'Sarah', specialties: ['coloring', 'highlights', 'styling'], rating: 4.9, availableDates: [], availableTimes: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
    { id: 'john', name: 'John', specialties: ['cuts', 'mens grooming', 'blowouts'], rating: 4.8, availableDates: [], availableTimes: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
    { id: 'emma', name: 'Emma', specialties: ['coloring', 'balayage', 'cuts'], rating: 4.7, availableDates: [], availableTimes: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '17:00'] },
    { id: 'lisa', name: 'Lisa', specialties: ['facials', 'makeup', 'skincare'], rating: 4.9, availableDates: [], availableTimes: ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00'] },
    { id: 'anna', name: 'Anna', specialties: ['nails', 'pedicure', 'makeup'], rating: 4.8, availableDates: [], availableTimes: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'] },
    { id: 'jennifer', name: 'Jennifer', specialties: ['nails', 'manicure', 'pedicure'], rating: 4.6, availableDates: [], availableTimes: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'] }
  ];

  constructor(whatsappService: WhatsAppService, config: SalonConfig = {}) {
    this.whatsappService = whatsappService;
    this.config = config;
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    if (this.config.redisUrl) {
      try {
        this.redis = new Redis(this.config.redisUrl, { maxRetriesPerRequest: null });
        this.reminderQueue = new Queue(this.config.reminderQueueName || 'salon-reminders', {
          connection: this.redis
        });
      } catch (error) {
        console.warn('Redis connection failed, reminders disabled:', error);
      }
    }
  }

  async start(): Promise<void> {
    this.whatsappService.onMessage('booking-bot', async (message) => {
      await this.handleMessage(message);
    });
  }

  private async handleMessage(message: IMessage): Promise<void> {
    const phoneNumber = this.extractPhoneNumber(message.from);

    let conversation = await Conversation.findOne({ phoneNumber });

    if (!conversation) {
      conversation = await Conversation.create({
        phoneNumber,
        state: ConversationState.GREETING,
        bookingDetails: {},
        conversationHistory: []
      });
    }

    conversation.conversationHistory.push(message);
    conversation.lastMessage = message;
    await conversation.save();

    const intent = nlpService.parse(message.content);
    const response = await this.processIntent(intent, conversation, message);

    if (response) {
      await this.whatsappService.sendTextMessage(phoneNumber, response);
    }
  }

  private extractPhoneNumber(waId: string): string {
    return waId.replace('@c.us', '').replace(/[^0-9]/g, '');
  }

  private async processIntent(
    intent: ParsedIntent,
    conversation: IConversation,
    message: IMessage
  ): Promise<string | null> {
    const state = conversation.state;

    switch (intent.intent) {
      case 'book':
      case 'select_stylist':
        return this.handleBooking(intent, conversation);

      case 'availability':
        return this.handleAvailability(intent, conversation);

      case 'confirm':
        return this.handleConfirmation(conversation);

      case 'cancel':
        return this.handleCancellation(conversation);

      case 'view_history':
        return this.handleViewHistory(conversation);

      case 'price':
        return this.handlePrice(intent, conversation);

      case 'recommend':
        return this.handleRecommendations(intent, conversation);

      case 'payment':
        return this.handlePayment(conversation);

      case 'reminder':
        return this.handleReminder(intent, conversation);

      case 'help':
        return HELP_MESSAGE;

      case 'unknown':
        if (state === ConversationState.SELECTING_STYLIST && intent.entities.stylist) {
          return this.handleStylistSelection(intent.entities.stylist[0], conversation);
        }
        if (state === ConversationState.SELECTING_DATE && intent.entities.date) {
          const date = nlpService.normalizeDate(intent.entities.date[0]);
          if (date) {
            return this.handleDateSelection(date, conversation);
          }
        }
        if (state === ConversationState.SELECTING_TIME && intent.entities.time) {
          const time = nlpService.normalizeTime(intent.entities.time[0]);
          if (time) {
            return this.handleTimeSelection(time, conversation);
          }
        }
        return this.getContextualResponse(state, conversation);

      default:
        return `I'm not sure I understand. Type "help" to see available options.`;
    }
  }

  private async handleBooking(intent: ParsedIntent, conversation: IConversation): Promise<string> {
    const services = this.matchServices(intent.entities.service || []);

    if (services.length === 0) {
      return this.showServicesCatalog();
    }

    if (services.length === 1) {
      const service = services[0];
      conversation.bookingDetails = {
        serviceId: service.id,
        serviceName: service.name,
        estimatedPrice: service.price,
        estimatedDuration: service.duration
      };
      conversation.state = ConversationState.SELECTING_STYLIST;
      await conversation.save();

      return this.showStylists(service);
    }

    return this.showServicesList(services);
  }

  private async handleStylistSelection(stylistName: string, conversation: IConversation): Promise<string> {
    const stylist = this.STYLISTS.find(s =>
      s.name.toLowerCase().includes(stylistName.toLowerCase()) ||
      stylistName.toLowerCase().includes(s.name.toLowerCase())
    );

    if (!stylist) {
      return this.showStylists(null, `Stylist "${stylistName}" not found. Please choose from the list.`);
    }

    conversation.bookingDetails.stylistId = stylist.id;
    conversation.bookingDetails.stylistName = stylist.name;
    conversation.state = ConversationState.SELECTING_DATE;
    await conversation.save();

    return `Great! You've selected *${stylist.name}*.

Now, when would you like to book? Please provide a date (e.g., "tomorrow", "next Monday", or a specific date).`;
  }

  private async handleDateSelection(date: string, conversation: IConversation): Promise<string> {
    conversation.bookingDetails.preferredDate = date;
    conversation.state = ConversationState.SELECTING_TIME;
    await conversation.save();

    return this.showAvailableTimes(date, conversation.bookingDetails.stylistId!);
  }

  private async handleTimeSelection(time: string, conversation: IConversation): Promise<string> {
    conversation.bookingDetails.preferredTime = time;
    conversation.state = ConversationState.CONFIRMING_BOOKING;
    await conversation.save();

    return this.showBookingSummary(conversation.bookingDetails);
  }

  private async handleConfirmation(conversation: IConversation): Promise<string> {
    const details = conversation.bookingDetails;

    if (!details.serviceName || !details.stylistName || !details.preferredDate || !details.preferredTime) {
      return `I need more information to confirm your booking. Please start over with "book".`;
    }

    const booking = await this.createBooking(details, conversation.phoneNumber);

    conversation.bookingDetails = {};
    conversation.state = ConversationState.COMPLETED;
    conversation.context.lastBookingId = booking.id;
    await conversation.save();

    return `✅ *Booking Confirmed!*

📅 Date: ${details.preferredDate}
⏰ Time: ${details.preferredTime}
✂️ Service: ${details.serviceName}
👤 Stylist: ${details.stylistName}
💰 Price: $${details.estimatedPrice}

Booking ID: ${booking.id}

You can pay now by saying "pay" or later. See you then!`;
  }

  private async handleCancellation(conversation: IConversation): Promise<string> {
    if (conversation.context.lastBookingId) {
      await this.cancelBooking(conversation.context.lastBookingId as string);
      delete conversation.context.lastBookingId;
      await conversation.save();
      return `Your booking has been cancelled. Sorry to see you go! If you'd like to rebook, just say "book".`;
    }

    return `You don't have unknown active bookings to cancel. Would you like to book a new appointment?`;
  }

  private async handleAvailability(intent: ParsedIntent, conversation: IConversation): Promise<string> {
    const services = this.matchServices(intent.entities.service || []);

    if (services.length === 0) {
      return `What service would you like to check availability for?`;
    }

    const service = services[0];
    const date = intent.entities.date?.[0] ? nlpService.normalizeDate(intent.entities.date[0]) : undefined;
    const stylistName = intent.entities.stylist?.[0];

    let stylists = service.availableStylists
      .map(id => this.STYLISTS.find(s => s.id === id))
      .filter((s): s is Stylist => s !== undefined);

    if (stylistName) {
      stylists = stylists.filter(s =>
        s.name.toLowerCase().includes(stylistName.toLowerCase())
      );
    }

    let response = `*Availability for ${service.name}:*\n\n`;

    for (const stylist of stylists) {
      const availableSlots = this.getAvailableSlots(date);
      response += `👤 *${stylist.name}* (${stylist.rating}⭐)\n`;
      if (availableSlots.length > 0) {
        response += `Available: ${availableSlots.join(', ')}\n\n`;
      } else {
        response += `No slots available for ${date || 'this week'}\n\n`;
      }
    }

    response += `\nTo book, say "book ${service.name}"`;

    return response;
  }

  private async handleViewHistory(conversation: IConversation): Promise<string> {
    const bookings = await this.getPastBookings(conversation.phoneNumber);

    if (bookings.length === 0) {
      return `You don't have unknown past appointments. Would you like to book one?`;
    }

    let response = `*Your Past Appointments:*\n\n`;

    for (const booking of bookings.slice(0, 5)) {
      response += `📅 *${booking.date}* at ${booking.time}\n`;
      response += `   ${booking.service.name} with ${booking.stylist.name}\n`;
      response += `   Status: ${booking.status}\n\n`;
    }

    return response;
  }

  private async handlePrice(intent: ParsedIntent, conversation: IConversation): Promise<string> {
    const services = this.matchServices(intent.entities.service || []);

    if (services.length === 0) {
      return this.showServicesCatalog(true);
    }

    let response = `*Pricing:*\n\n`;
    for (const service of services) {
      response += `✂️ *${service.name}*: $${service.price} (${service.duration} mins)\n`;
    }

    return response;
  }

  private async handleRecommendations(intent: ParsedIntent, conversation: IConversation): Promise<string> {
    const services = this.matchServices(intent.entities.service || []);

    let recommendedServices: Service[];
    let recommendedStylists: Stylist[];

    if (services.length > 0) {
      recommendedServices = services;
      const stylistIds = new Set(services.flatMap(s => s.availableStylists));
      recommendedStylists = this.STYLISTS.filter(s => stylistIds.has(s.id))
        .sort((a, b) => b.rating - a.rating);
    } else {
      recommendedServices = this.SERVICES_CATALOG.slice(0, 5);
      recommendedStylists = this.STYLISTS.slice(0, 3);
    }

    let response = `*Recommendations for You:*\n\n`;

    response += `*Popular Services:*\n`;
    for (const service of recommendedServices) {
      response += `✂️ ${service.name} - $${service.price}\n`;
    }

    response += `\n*Top Rated Stylists:*\n`;
    for (const stylist of recommendedStylists) {
      response += `👤 ${stylist.name} - ${stylist.rating}⭐ (${stylist.specialties.join(', ')})\n`;
    }

    return response;
  }

  private async handlePayment(conversation: IConversation): Promise<string> {
    let bookingId = conversation.context.lastBookingId as string;

    if (!bookingId) {
      const bookings = await this.getActiveBookings(conversation.phoneNumber);
      if (bookings.length === 0) {
        return `You don't have unknown pending bookings to pay for.`;
      }
      bookingId = bookings[0].id;
    }

    const paymentLink = await this.generatePaymentLink(bookingId);
    return `*Payment Link*\n\nClick here to pay: ${paymentLink}\n\nPlease complete payment within 24 hours to confirm your booking.`;
  }

  private async handleReminder(intent: ParsedIntent, conversation: IConversation): Promise<string> {
    const bookingId = conversation.context.lastBookingId as string;

    if (!bookingId) {
      return `I need to know which booking to remind you about. Can you provide the booking ID?`;
    }

    const reminderDate = intent.entities.date?.[0]
      ? nlpService.normalizeDate(intent.entities.date[0])
      : undefined;

    if (!reminderDate) {
      return `When would you like to be reminded?`;
    }

    await this.scheduleReminder(bookingId, reminderDate, conversation.phoneNumber);

    return `I'll send you a reminder before your appointment on ${reminderDate}.`;
  }

  private getContextualResponse(state: ConversationState, conversation: IConversation): string {
    switch (state) {
      case ConversationState.SELECTING_STYLIST:
        return `Please select a stylist from the options above, or tell me your preference.`;

      case ConversationState.SELECTING_DATE:
        return `When would you like to come in? (e.g., "tomorrow", "next week", or a specific date)`;

      case ConversationState.SELECTING_TIME:
        return `What time works for you? (e.g., "10am", "2pm", or a specific time)`;

      case ConversationState.CONFIRMING_BOOKING:
        return `Please confirm your booking by saying "yes" or "confirm", or provide more details.`;

      default:
        return `I didn't understand that. Type "help" for available options.`;
    }
  }

  private matchServices(queries: string[]): Service[] {
    if (queries.length === 0) return [];

    const lowerQueries = queries.map(q => q.toLowerCase());

    return this.SERVICES_CATALOG.filter(service => {
      const searchText = `${service.name} ${service.category} ${service.description}`.toLowerCase();
      return lowerQueries.some(query =>
        searchText.includes(query) ||
        service.name.toLowerCase().includes(query) ||
        query.includes(service.name.toLowerCase().split(' ')[0])
      );
    });
  }

  private showServicesCatalog(showPrices = false): string {
    const categories = new Map<string, Service[]>();

    for (const service of this.SERVICES_CATALOG) {
      const existing = categories.get(service.category) || [];
      existing.push(service);
      categories.set(service.category, existing);
    }

    let response = showPrices ? `*Services & Prices:*\n\n` : `*Our Services:*\n\n`;

    for (const [category, services] of categories) {
      const emoji = category === 'hair' ? '✂️' : category === 'skin' ? '✨' : category === 'nails' ? '💅' : category === 'makeup' ? '💄' : '💆';
      response += `*${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}*\n`;

      for (const service of services) {
        if (showPrices) {
          response += `• ${service.name}: $${service.price}\n`;
        } else {
          response += `• ${service.name}\n`;
        }
      }
      response += `\n`;
    }

    response += `Tell me which service you'd like to book!`;

    return response;
  }

  private showServicesList(services: Service[]): string {
    let response = `*Found ${services.length} matching service(s):*\n\n`;

    for (let i = 1; i <= services.length; i++) {
      const service = services[i - 1];
      response += `${i}. *${service.name}*\n   $${service.price} • ${service.duration} mins\n\n`;
    }

    response += `Which one would you like? (1-${services.length})`;

    return response;
  }

  private showStylists(service: Service | null, customMessage?: string): string {
    let stylists = service
      ? this.STYLISTS.filter(s => service.availableStylists.includes(s.id))
      : this.STYLISTS;

    stylists = stylists.sort((a, b) => b.rating - a.rating);

    let response = customMessage ? `${customMessage}\n\n` : ``;
    response += `*Select a Stylist:*\n\n`;

    for (const stylist of stylists) {
      response += `👤 *${stylist.name}* - ${stylist.rating}⭐\n`;
      response += `   Specialties: ${stylist.specialties.join(', ')}\n\n`;
    }

    response += `Tell me which stylist you'd prefer.`;

    return response;
  }

  private showAvailableTimes(date: string, stylistId: string): string {
    const stylist = this.STYLISTS.find(s => s.id === stylistId);
    if (!stylist) {
      return `Stylist not found. Please select again.`;
    }

    const slots = this.getAvailableSlots(date, stylistId);

    let response = `*Available Times with ${stylist.name}:*\n`;
    response += `Date: ${date}\n\n`;

    if (slots.length === 0) {
      response += `No slots available on this date. Would you like to try another date?`;
    } else {
      response += `Available: ${slots.join(', ')}\n\n`;
      response += `What time works for you?`;
    }

    return response;
  }

  private getAvailableSlots(date?: string, stylistId?: string): string[] {
    const stylist = stylistId ? this.STYLISTS.find(s => s.id === stylistId) : null;
    if (!stylist) {
      return stylistId ? [] : this.STYLISTS[0]?.availableTimes || [];
    }

    return stylist.availableTimes;
  }

  private showBookingSummary(details: IBookingDetails): string {
    return `*Booking Summary:*

✂️ Service: ${details.serviceName}
👤 Stylist: ${details.stylistName}
📅 Date: ${details.preferredDate}
⏰ Time: ${details.preferredTime}
💰 Price: $${details.estimatedPrice}
⏱️ Duration: ${details.estimatedDuration} mins

Do you confirm this booking? (yes/no)`;
  }

  private async createBooking(details: IBookingDetails, phoneNumber: string): Promise<Booking> {
    const stylist = this.STYLISTS.find(s => s.id === details.stylistId)!;
    const service = this.SERVICES_CATALOG.find(s => s.id === details.serviceId)!;

    const booking: Booking = {
      id: `BK${Date.now()}`,
      customerId: '',
      phoneNumber,
      service,
      stylist,
      date: details.preferredDate!,
      time: details.preferredTime!,
      status: 'confirmed',
      price: details.estimatedPrice!,
      reminderSent: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (this.config.salonServiceUrl && this.config.internalServiceToken) {
      try {
        const response = await axios.post(`${this.config.salonServiceUrl}/bookings`, booking, {
          headers: { 'X-Internal-Token': this.config.internalServiceToken }
        });
        booking.id = response.data.id || booking.id;
      } catch (error) {
        console.error('Failed to sync booking with salon service:', error);
      }
    }

    return booking;
  }

  private async cancelBooking(bookingId: string): Promise<void> {
    if (this.config.salonServiceUrl && this.config.internalServiceToken) {
      try {
        await axios.delete(`${this.config.salonServiceUrl}/bookings/${bookingId}`, {
          headers: { 'X-Internal-Token': this.config.internalServiceToken }
        });
      } catch (error) {
        console.error('Failed to cancel booking with salon service:', error);
      }
    }
  }

  private async getPastBookings(phoneNumber: string): Promise<Booking[]> {
    if (this.config.salonServiceUrl && this.config.internalServiceToken) {
      try {
        const response = await axios.get(`${this.config.salonServiceUrl}/bookings/history`, {
          params: { phoneNumber },
          headers: { 'X-Internal-Token': this.config.internalServiceToken }
        });
        return response.data;
      } catch (error) {
        console.error('Failed to fetch bookings from salon service:', error);
      }
    }

    return [];
  }

  private async getActiveBookings(phoneNumber: string): Promise<Booking[]> {
    if (this.config.salonServiceUrl && this.config.internalServiceToken) {
      try {
        const response = await axios.get(`${this.config.salonServiceUrl}/bookings/active`, {
          params: { phoneNumber },
          headers: { 'X-Internal-Token': this.config.internalServiceToken }
        });
        return response.data;
      } catch (error) {
        console.error('Failed to fetch active bookings:', error);
      }
    }

    return [];
  }

  private async generatePaymentLink(bookingId: string): Promise<string> {
    if (this.config.salonServiceUrl && this.config.internalServiceToken) {
      try {
        const response = await axios.post(`${this.config.salonServiceUrl}/payments/link`, {
          bookingId
        }, {
          headers: { 'X-Internal-Token': this.config.internalServiceToken }
        });
        return response.data.paymentLink;
      } catch (error) {
        console.error('Failed to generate payment link:', error);
      }
    }

    return `https://pay.example.com/salon/${bookingId}`;
  }

  private async scheduleReminder(bookingId: string, reminderDate: string, phoneNumber: string): Promise<void> {
    if (this.reminderQueue) {
      await this.reminderQueue.add('reminder', {
        bookingId,
        phoneNumber,
        reminderDate,
        message: `Reminder: Your salon appointment is coming up!`
      }, {
        delay: new Date(reminderDate).getTime() - Date.now() - 3600000
      });
    }
  }

  async stop(): Promise<void> {
    this.whatsappService.removeMessageHandler('booking-bot');
    if (this.reminderQueue) {
      await this.reminderQueue.close();
    }
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
