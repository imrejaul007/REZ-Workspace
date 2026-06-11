/**
 * Booking AI - Travel Booking Assistant
 * Part of TRIPMIND - Travel Agency AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface BookingRequest {
  type: 'flight' | 'hotel' | 'package';
  destination?: string;
  departure?: string;
  checkIn?: string;
  checkOut?: string;
  travelers: number;
  preferences?: string[];
}

export interface SearchResult {
  id: string;
  type: string;
  name: string;
  price: number;
  rating: number;
  imageUrl?: string;
  matchScore: number;
}

export class BookingAI {
  async searchFlights(request: BookingRequest): Promise<SearchResult[]> {
    return [
      { id: '1', type: 'flight', name: 'Air India AI-201', price: 8500 + Math.random() * 3000, rating: 4.2, matchScore: 95 },
      { id: '2', type: 'flight', name: 'IndiGo 6E-452', price: 7000 + Math.random() * 2000, rating: 4.0, matchScore: 88 },
      { id: '3', type: 'flight', name: 'SpiceJet SG-234', price: 6500 + Math.random() * 2000, rating: 3.8, matchScore: 82 },
    ];
  }

  async searchHotels(request: BookingRequest): Promise<SearchResult[]> {
    return [
      { id: '1', type: 'hotel', name: 'Grand Palace Hotel', price: 5000 + Math.random() * 3000, rating: 4.5, matchScore: 92 },
      { id: '2', type: 'hotel', name: 'Seaside Resort', price: 4000 + Math.random() * 2000, rating: 4.3, matchScore: 85 },
      { id: '3', type: 'hotel', name: 'City Center Inn', price: 2500 + Math.random() * 1500, rating: 4.0, matchScore: 78 },
    ];
  }

  async comparePrices(items: { id: string; price: number }[]): Promise<{
    cheapest: string;
    bestValue: string;
    avgPrice: number;
  }> {
    const prices = items.map(i => i.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const sorted = [...items].sort((a, b) => a.price - b.price);

    return {
      cheapest: sorted[0].id,
      bestValue: sorted[Math.floor(sorted.length / 2)].id,
      avgPrice
    };
  }

  async generateBookingSummary(items: SearchResult[], travelers: number): Promise<{
    subtotal: number;
    taxes: number;
    total: number;
    perPersonCost: number;
  }> {
    const subtotal = items.reduce((sum, i) => sum + i.price, 0);
    const taxes = subtotal * 0.18;
    const total = subtotal + taxes;

    return {
      subtotal,
      taxes: Math.round(taxes),
      total: Math.round(total),
      perPersonCost: Math.round(total / travelers)
    };
  }

  async processPayment(total: number): Promise<{
    transactionId: string;
    amount: number;
    status: 'success' | 'pending' | 'failed';
    message: string;
  }> {
    return {
      transactionId: uuidv4(),
      amount: total,
      status: 'success',
      message: 'Payment processed successfully. Booking confirmed!'
    };
  }
}

export default BookingAI;