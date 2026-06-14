import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { TravelPolicy, TravelBooking, TravelRequest } from '../../models';
import { BookingType, BookingStatus, ApprovalStatus } from '../../types';
import { logger } from '../../config/logger';

export interface TBOServiceConfig {
  apiKey: string;
  apiSecret: string;
  clientId: string;
}

export interface HotelSearchParams {
  cityId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class?: string;
}

export interface TBOSearchResult {
  hotelId: string;
  hotelName: string;
  starRating: number;
  address: string;
  imageUrl: string;
  price: number;
  currency: string;
  amenities: string[];
}

export class TravelService {
  private tboClient: AxiosInstance;
  private config: TBOServiceConfig;

  constructor() {
    this.config = {
      apiKey: process.env.TBO_API_KEY || '',
      apiSecret: process.env.TBO_API_SECRET || '',
      clientId: process.env.TBO_CLIENT_ID || ''
    };

    this.tboClient = axios.create({
      baseURL: process.env.TBO_API_URL || 'https://api.tbotech.in/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private async authenticate(): Promise<string> {
    try {
      const response = await this.tboClient.post('/auth/token', {
        clientId: this.config.clientId,
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret
      });

      return response.data.access_token;
    } catch (error: any) {
      logger.error('TBO authentication failed', { error: error.message });
      throw new Error('Failed to authenticate with travel provider');
    }
  }

  async getTravelPolicy(companyId: string): Promise<any> {
    const policy = await TravelPolicy.findOne({ companyId, isDefault: true });
    if (!policy) {
      // Return default policy
      return {
        companyId,
        name: 'Default Travel Policy',
        rules: {
          hotelStarRating: 4,
          hotelMaxPrice: 5000,
          flightClass: ['Economy'],
          cabTier: ['Standard']
        },
        approvalRequired: {
          aboveAmount: 5000
        }
      };
    }
    return policy;
  }

  async checkPolicyCompliance(params: {
    companyId: string;
    employeeId: string;
    bookingType: BookingType;
    cost: number;
    details: any;
  }): Promise<{
    compliant: boolean;
    violations: Array<{ rule: string; message: string; requiresApproval: boolean }>;
    autoApproved: boolean;
  }> {
    const policy = await this.getTravelPolicy(params.companyId);
    const violations: Array<{ rule: string; message: string; requiresApproval: boolean }> = [];

    if (!policy) {
      return { compliant: true, violations: [], autoApproved: true };
    }

    switch (params.bookingType) {
      case BookingType.HOTEL:
        if (policy.rules.hotelStarRating && params.details.hotelStar > policy.rules.hotelStarRating) {
          violations.push({
            rule: 'hotel_star',
            message: `Hotel exceeds ${policy.rules.hotelStarRating}-star limit`,
            requiresApproval: true
          });
        }
        if (policy.rules.hotelMaxPrice && params.cost > policy.rules.hotelMaxPrice) {
          violations.push({
            rule: 'hotel_price',
            message: `Hotel rate exceeds limit of ₹${policy.rules.hotelMaxPrice}`,
            requiresApproval: true
          });
        }
        break;

      case BookingType.FLIGHT:
        if (policy.rules.flightClass && params.details.flightClass) {
          if (!policy.rules.flightClass.includes(params.details.flightClass)) {
            violations.push({
              rule: 'flight_class',
              message: `${params.details.flightClass} not allowed per policy`,
              requiresApproval: true
            });
          }
        }
        break;
    }

    // Check if approval required
    if (policy.approvalRequired?.aboveAmount && params.cost > policy.approvalRequired.aboveAmount) {
      violations.push({
        rule: 'approval_required',
        message: `Amount exceeds ₹${policy.approvalRequired.aboveAmount} approval threshold`,
        requiresApproval: true
      });
    }

    return {
      compliant: violations.length === 0,
      violations,
      autoApproved: violations.filter(v => v.requiresApproval).length === 0
    };
  }

  async searchHotels(params: HotelSearchParams): Promise<TBOSearchResult[]> {
    try {
      const token = await this.authenticate();

      const response = await this.tboClient.post('/hotels/search', {
        cityId: params.cityId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        rooms: params.rooms,
        guests: params.guests
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      return response.data.hotels?.map((hotel: any) => ({
        hotelId: hotel.HotelCode,
        hotelName: hotel.HotelName,
        starRating: hotel.StarRating,
        address: hotel.Address,
        imageUrl: hotel.ImageURLs?.[0] || '',
        price: hotel.Price?.PublishedPriceRoundedOff || hotel.Price?.OfferedPrice,
        currency: 'INR',
        amenities: hotel.Amenities?.slice(0, 5) || []
      })) || [];
    } catch (error: any) {
      logger.error('Hotel search failed', { error: error.message });
      return this.getDemoHotels();
    }
  }

  async searchFlights(params: FlightSearchParams): Promise<any[]> {
    try {
      const token = await this.authenticate();

      const response = await this.tboClient.post('/flights/search', {
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        passengers: params.passengers,
        cabinClass: params.class || 'Economy'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      return response.data.flights || [];
    } catch (error: any) {
      logger.error('Flight search failed', { error: error.message });
      return [];
    }
  }

  async createTravelRequest(params: {
    companyId: string;
    employeeId: string;
    bookingType: BookingType;
    purpose: string;
    destination: string;
    departureDate: Date;
    returnDate?: Date;
    estimatedCost: number;
  }): Promise<any> {
    // Get policy and check compliance
    const compliance = await this.checkPolicyCompliance({
      companyId: params.companyId,
      employeeId: params.employeeId,
      bookingType: params.bookingType,
      cost: params.estimatedCost,
      details: {}
    });

    const policy = await this.getTravelPolicy(params.companyId);

    // Determine approver
    let approverId: string | undefined;
    if (compliance.violations.some(v => v.requiresApproval) && policy.approvers?.length > 0) {
      approverId = policy.approvers[0];
    }

    const request = new TravelRequest({
      companyId: params.companyId,
      employeeId: params.employeeId,
      bookingType: params.bookingType,
      purpose: params.purpose,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      estimatedCost: params.estimatedCost,
      policyId: policy._id,
      policyViolations: compliance.violations,
      status: compliance.autoApproved ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
      approverId
    });

    await request.save();

    if (!compliance.autoApproved && approverId) {
      await this.notifyApprover(approverId, request);
    }

    logger.info('Travel request created', {
      requestId: request._id,
      employeeId: params.employeeId,
      status: request.status
    });

    return request;
  }

  async approveTravelRequest(params: {
    requestId: string;
    approverId: string;
    notes?: string;
  }): Promise<any> {
    const request = await TravelRequest.findById(params.requestId);
    if (!request) {
      throw new Error('Travel request not found');
    }

    if (request.approverId?.toString() !== params.approverId) {
      throw new Error('Not authorized to approve this request');
    }

    request.status = ApprovalStatus.APPROVED;
    request.approverId = params.approverId as unknown as typeof request.approverId;
    request.approverNotes = params.notes;
    request.respondedAt = new Date();

    await request.save();

    await this.notifyEmployee(request.employeeId.toString(), {
      type: 'request_approved',
      requestId: request._id
    });

    return request;
  }

  async rejectTravelRequest(params: {
    requestId: string;
    approverId: string;
    reason: string;
  }): Promise<void> {
    const request = await TravelRequest.findById(params.requestId);
    if (!request) {
      throw new Error('Travel request not found');
    }

    request.status = ApprovalStatus.REJECTED;
    request.approverId = params.approverId as unknown as typeof request.approverId;
    request.approverNotes = params.reason;
    request.respondedAt = new Date();

    await request.save();

    await this.notifyEmployee(request.employeeId.toString(), {
      type: 'request_rejected',
      requestId: request._id,
      reason: params.reason
    });
  }

  async bookHotel(params: {
    requestId?: string;
    companyId: string;
    employeeId: string;
    hotelId: string;
    hotelName: string;
    checkIn: Date;
    checkOut: Date;
    roomType: string;
    cost: number;
  }): Promise<any> {
    const booking = new TravelBooking({
      companyId: params.companyId,
      employeeId: params.employeeId,
      bookingType: BookingType.HOTEL,
      status: BookingStatus.BOOKED,
      travelDetails: {
        hotelName: params.hotelName,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        roomType: params.roomType
      },
      costEstimate: {
        amount: params.cost,
        currency: 'INR'
      },
      bookingReference: this.generateBookingRef(),
      bookedAt: new Date()
    });

    await booking.save();

    logger.info('Hotel booking created', {
      bookingId: booking._id,
      employeeId: params.employeeId,
      hotelName: params.hotelName
    });

    return booking;
  }

  async bookFlight(params: {
    companyId: string;
    employeeId: string;
    flightId: string;
    flightClass: string;
    departure: Date;
    arrival: Date;
    origin: string;
    destination: string;
    cost: number;
  }): Promise<any> {
    const booking = new TravelBooking({
      companyId: params.companyId,
      employeeId: params.employeeId,
      bookingType: BookingType.FLIGHT,
      status: BookingStatus.BOOKED,
      travelDetails: {
        origin: params.origin,
        destination: params.destination,
        departure: params.departure,
        arrival: params.arrival,
        flightClass: params.flightClass
      },
      costEstimate: {
        amount: params.cost,
        currency: 'INR'
      },
      bookingReference: this.generateBookingRef(),
      bookedAt: new Date()
    });

    await booking.save();

    logger.info('Flight booking created', {
      bookingId: booking._id,
      employeeId: params.employeeId
    });

    return booking;
  }

  async getEmployeeBookings(params: {
    employeeId: string;
    status?: BookingStatus;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const query: any = { employeeId: params.employeeId };
    if (params.status) {
      query.status = params.status;
    }

    const page = params.page || 1;
    const limit = params.limit || 20;

    const [bookings, total] = await Promise.all([
      TravelBooking.find(query)
        .sort({ bookedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      TravelBooking.countDocuments(query)
    ]);

    return { bookings, total, page, totalPages: Math.ceil(total / limit) };
  }

  async cancelBooking(params: {
    bookingId: string;
    reason: string;
  }): Promise<void> {
    const booking = await TravelBooking.findById(params.bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelReason = params.reason;

    await booking.save();

    logger.info('Travel booking cancelled', {
      bookingId: params.bookingId,
      reason: params.reason
    });
  }

  async createTravelPolicy(params: {
    companyId: string;
    name: string;
    description?: string;
    rules: {
      hotelStarRating?: number;
      hotelMaxPrice?: number;
      flightClass?: string[];
      cabTier?: string[];
      mealAllowance?: number;
      dailyAllowance?: number;
    };
    approvers?: string[];
    isDefault?: boolean;
  }): Promise<any> {
    if (params.isDefault) {
      await TravelPolicy.updateMany(
        { companyId: params.companyId },
        { $set: { isDefault: false } }
      );
    }

    const policy = new TravelPolicy({
      companyId: params.companyId,
      name: params.name,
      description: params.description,
      rules: params.rules,
      approvers: params.approvers || [],
      isDefault: params.isDefault || false
    });

    await policy.save();

    logger.info('Travel policy created', { policyId: policy._id });

    return policy;
  }

  private generateBookingRef(): string {
    return `TRV${Date.now().toString(36).toUpperCase()}`;
  }

  private async notifyApprover(approverId: string, request: any): Promise<void> {
    try {
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/send`, {
        userId: approverId,
        type: 'push',
        title: 'Travel Request Pending',
        body: `New travel request from employee`,
        data: {
          type: 'travel_request',
          requestId: request._id
        }
      });
    } catch (error) {
      logger.error('Failed to notify approver', { error });
    }
  }

  private async notifyEmployee(employeeId: string, data: any): Promise<void> {
    try {
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/send`, {
        userId: employeeId,
        type: 'push',
        title: data.type === 'request_approved' ? 'Request Approved' : 'Request Update',
        body: data.type === 'request_approved'
          ? 'Your travel request has been approved'
          : 'Your travel request was not approved',
        data
      });
    } catch (error) {
      logger.error('Failed to notify employee', { error });
    }
  }

  private getDemoHotels(): TBOSearchResult[] {
    return [
      {
        hotelId: 'HTL001',
        hotelName: 'The Grand Hotel',
        starRating: 4,
        address: 'MG Road, Bangalore',
        imageUrl: 'https://placeholder.com/hotel1.jpg',
        price: 4500,
        currency: 'INR',
        amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Spa']
      },
      {
        hotelId: 'HTL002',
        hotelName: 'City View Suites',
        starRating: 3,
        address: 'Koramangala, Bangalore',
        imageUrl: 'https://placeholder.com/hotel2.jpg',
        price: 2800,
        currency: 'INR',
        amenities: ['WiFi', 'Restaurant', 'Parking']
      },
      {
        hotelId: 'HTL003',
        hotelName: 'Budget Inn',
        starRating: 2,
        address: 'Indiranagar, Bangalore',
        imageUrl: 'https://placeholder.com/hotel3.jpg',
        price: 1500,
        currency: 'INR',
        amenities: ['WiFi', 'AC']
      }
    ];
  }
}

export const travelService = new TravelService();
