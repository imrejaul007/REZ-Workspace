/**
 * Bellhop AI - Luggage & Transport Agent
 * Part of STAYBOT - Hotel AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface BellhopRequest {
  id: string;
  guestId: string;
  roomNumber: string;
  requestType: 'luggage' | 'transport' | 'wheelchair' | 'cart' | 'package';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  eta: string;
  handledBy?: string;
}

export interface TransportBooking {
  id: string;
  guestId: string;
  type: 'taxi' | 'car-rental' | 'airport-transfer' | 'train';
  pickupTime: string;
  pickupLocation: string;
  destination: string;
  vehicleType?: string;
  estimatedCost?: number;
  driverName?: string;
  driverPhone?: string;
  status: 'confirmed' | 'en-route' | 'completed' | 'cancelled';
}

export class BellhopAI {
  private readonly etaMap: Record<string, string> = {
    'luggage': '5 minutes',
    'transport': '10 minutes',
    'wheelchair': '3 minutes',
    'cart': '2 minutes',
    'package': '8 minutes'
  };

  /**
   * Handle bellhop request
   */
  async handleRequest(
    guestId: string,
    roomNumber: string,
    requestType: BellhopRequest['requestType']
  ): Promise<{ request: BellhopRequest; message: string }> {
    const request: BellhopRequest = {
      id: uuidv4(),
      guestId,
      roomNumber,
      requestType,
      status: 'pending',
      createdAt: new Date().toISOString(),
      eta: this.etaMap[requestType] || '10 minutes',
      handledBy: 'Bellhop Team'
    };

    const message = this.generateRequestMessage(request);

    return { request, message };
  }

  /**
   * Book transportation
   */
  async bookTransport(
    guestId: string,
    type: TransportBooking['type'],
    pickupTime: string,
    destination: string,
    options?: { vehicleType?: string; specialRequests?: string }
  ): Promise<{ booking: TransportBooking; message: string }> {
    const booking: TransportBooking = {
      id: uuidv4(),
      guestId,
      type,
      pickupTime,
      pickupLocation: 'Hotel Lobby',
      destination,
      vehicleType: options?.vehicleType || 'Standard',
      estimatedCost: this.estimateCost(type, destination),
      status: 'confirmed'
    };

    return {
      booking,
      message: `Transportation booked! ${type.replace('-', ' ')} will arrive at Hotel Lobby at ${pickupTime}. Estimated cost: ₹${booking.estimatedCost}.`
    };
  }

  /**
   * Track luggage
   */
  async trackLuggage(
    luggageTag: string
  ): Promise<{
    status: 'in-lobby' | 'in-room' | 'stored' | 'delivered';
    location: string;
    eta?: string;
  }> {
    const statuses = ['in-lobby', 'in-room', 'stored', 'delivered'] as const;
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      status,
      location: status === 'in-lobby' ? 'Main Entrance' : status === 'in-room' ? `Room ${Math.floor(Math.random() * 3) + 1}0${Math.floor(Math.random() * 2) + 1}` : 'Bell Station',
      eta: status !== 'delivered' ? '5 minutes' : undefined
    };
  }

  /**
   * Handle special assistance request
   */
  async requestAssistance(
    guestId: string,
    assistanceType: 'mobility' | 'medical' | 'language' | 'VIP'
  ): Promise<{ ticketId: string; message: string; specialist?: string }> {
    const specialists: Record<string, string> = {
      'mobility': 'Accessibility Team',
      'medical': 'First Aid Certified Staff',
      'language': 'Multilingual Concierge',
      'VIP': 'VIP Services Manager'
    };

    return {
      ticketId: uuidv4(),
      message: `${specialists[assistanceType] || 'Staff'} has been notified and will assist you shortly.`,
      specialist: specialists[assistanceType]
    };
  }

  /**
   * Process package handling
   */
  async handlePackage(
    guestId: string,
    action: 'receive' | 'deliver' | 'store' | 'collect',
    packageDetails?: { carrier?: string; trackingId?: string; size?: string }
  ): Promise<{ ticketId: string; message: string; storageFee?: number }> {
    const messages: Record<string, string> = {
      'receive': `Package received from ${packageDetails?.carrier || 'courier'}. Will be delivered to your room within 30 minutes.`,
      'deliver': 'Package is being delivered to your room now.',
      'store': 'Package stored in secure storage. Access available 24/7 at the bell station.',
      'collect': 'Please collect your package from the bell station. Valid ID required.'
    };

    const storageFee = action === 'store' ? 100 : undefined;

    return {
      ticketId: uuidv4(),
      message: messages[action],
      storageFee
    };
  }

  /**
   * Get ETA for pending requests
   */
  async getETA(requestId: string): Promise<{ eta: string; status: string }> {
    return {
      eta: '3 minutes',
      status: 'On the way'
    };
  }

  private generateRequestMessage(request: BellhopRequest): string {
    const typeMessages: Record<string, string> = {
      'luggage': `Luggage assistance for Room ${request.roomNumber}. Team dispatched. ETA: ${request.eta}.`,
      'transport': `Transportation requested from Room ${request.roomNumber}. Vehicle will arrive in ${request.eta}.`,
      'wheelchair': `Wheelchair assistance for Room ${request.roomNumber}. ETA: ${request.eta}.`,
      'cart': `Luggage cart arriving at Room ${request.roomNumber} in ${request.eta}.`,
      'package': `Package delivery for Room ${request.roomNumber}. ETA: ${request.eta}.`
    };

    return typeMessages[request.requestType] || `Assistance for Room ${request.roomNumber}. ETA: ${request.eta}.`;
  }

  private estimateCost(type: TransportBooking['type'], destination: string): number {
    const baseRates: Record<string, number> = {
      'taxi': 50,
      'car-rental': 500,
      'airport-transfer': 800,
      'train': 300
    };

    const distanceMultiplier = destination.toLowerCase().includes('airport') ? 2 : 1;

    return (baseRates[type] || 100) * distanceMultiplier + Math.floor(Math.random() * 200);
  }
}

export default BellhopAI;