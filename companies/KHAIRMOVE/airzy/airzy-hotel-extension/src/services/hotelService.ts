import mongoose, { Schema, Document, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Hotel, HotelBooking, RoomServiceOrder } from '../types';
import { logger } from '../utils/logger';

interface IHotelBooking extends Document {
  confirmationCode: string; userId: string; hotel: any; room: any; checkIn: string; checkOut: string; guests: number; totalAmount: number; currency: string; status: string; paymentStatus: string;
}

interface IRoomService extends Document {
  bookingId: string; items: any[]; totalAmount: number; status: string;
}

const HotelBookingSchema = new Schema({
  confirmationCode: { type: String, required: true, unique: true }, userId: { type: String, required: true, index: true },
  hotel: { id: String, name: String }, room: { id: String, name: String },
  checkIn: { type: String, required: true }, checkOut: { type: String, required: true }, guests: { type: Number, required: true },
  totalAmount: { type: Number, required: true }, currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' }
}, { timestamps: true });

const RoomServiceSchema = new Schema({
  bookingId: { type: String, required: true, index: true }, items: [{ name: String, quantity: Number, price: Number }],
  totalAmount: { type: Number, required: true }, status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'delivered'], default: 'pending' }
}, { timestamps: true });

export const HotelBookingModel = model<IHotelBooking>('HotelBooking', HotelBookingSchema);
export const RoomServiceModel = model<IRoomService>('RoomService', RoomServiceSchema);

const sampleHotels: Hotel[] = [
  { id: 'HTL001', name: 'The Leela Palace', location: { address: 'Kesar Springs', city: 'Mumbai', country: 'IN', lat: 19.0896, lng: 72.8656 }, rating: 4.8, reviewCount: 2345, images: ['/hotels/leela-1.jpg'], amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar'], price: { amount: 15000, currency: 'INR' }, roomTypes: [{ id: 'R001', name: 'Deluxe Room', description: 'Spacious room with city view', maxGuests: 2, price: { amount: 15000, currency: 'INR' }, amenities: ['wifi', 'tv', 'minibar'], available: 5 }, { id: 'R002', name: 'Suite', description: 'Luxury suite with lounge area', maxGuests: 3, price: { amount: 25000, currency: 'INR' }, amenities: ['wifi', 'tv', 'minibar', 'jacuzzi'], available: 2 }] },
  { id: 'HTL002', name: 'Taj Palace Hotel', location: { address: '20th Floor', city: 'New Delhi', country: 'IN', lat: 28.5665, lng: 77.1031 }, rating: 4.7, reviewCount: 1890, images: ['/hotels/taj-1.jpg'], amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant'], price: { amount: 12000, currency: 'INR' }, roomTypes: [{ id: 'R003', name: 'Premium Room', description: 'Modern room with garden view', maxGuests: 2, price: { amount: 12000, currency: 'INR' }, amenities: ['wifi', 'tv'], available: 8 }] },
  { id: 'HTL003', name: 'ITC Grand Chola', location: { address: 'Lady Esho', city: 'Chennai', country: 'IN', lat: 12.9941, lng: 80.1709 }, rating: 4.6, reviewCount: 1567, images: ['/hotels/itc-1.jpg'], amenities: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'bar', 'business_center'], price: { amount: 10000, currency: 'INR' }, roomTypes: [{ id: 'R004', name: 'Executive Room', description: 'Comfortable room for business travelers', maxGuests: 2, price: { amount: 10000, currency: 'INR' }, amenities: ['wifi', 'tv', 'workspace'], available: 12 }] }
];

export class HotelService {
  async searchHotels(city?: string, checkIn?: string, checkOut?: string, guests?: number): Promise<Hotel[]> {
    let results = [...sampleHotels];
    if (city) results = results.filter(h => h.location.city.toLowerCase().includes(city.toLowerCase()));
    return results;
  }

  async getHotelById(hotelId: string): Promise<Hotel | null> {
    return sampleHotels.find(h => h.id === hotelId) || null;
  }

  async bookHotel(userId: string, hotelId: string, roomId: string, checkIn: string, checkOut: string, guests: number): Promise<HotelBooking> {
    const hotel = sampleHotels.find(h => h.id === hotelId);
    if (!hotel) throw new Error('Hotel not found');
    const room = hotel.roomTypes.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');

    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = room.price.amount * nights;

    const booking = new HotelBookingModel({
      confirmationCode: `HTL${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      userId, hotel: { id: hotel.id, name: hotel.name }, room: { id: room.id, name: room.name },
      checkIn, checkOut, guests, totalAmount, currency: 'INR', status: 'pending', paymentStatus: 'pending'
    });
    await booking.save();
    return { id: booking._id.toString(), confirmationCode: booking.confirmationCode, userId: booking.userId, hotel: booking.hotel as any, room: booking.room as any, checkIn: booking.checkIn, checkOut: booking.checkOut, guests: booking.guests, totalAmount: booking.totalAmount, currency: booking.currency, status: booking.status as any, paymentStatus: booking.paymentStatus as any, createdAt: booking.createdAt };
  }

  async getBooking(bookingId: string): Promise<HotelBooking | null> {
    const b = await HotelBookingModel.findById(bookingId);
    return b ? { id: b._id.toString(), confirmationCode: b.confirmationCode, userId: b.userId, hotel: b.hotel as any, room: b.room as any, checkIn: b.checkIn, checkOut: b.checkOut, guests: b.guests, totalAmount: b.totalAmount, currency: b.currency, status: b.status as any, paymentStatus: b.paymentStatus as any, createdAt: b.createdAt } : null;
  }

  async getUserBookings(userId: string): Promise<HotelBooking[]> {
    const bookings = await HotelBookingModel.find({ userId }).sort({ createdAt: -1 });
    return bookings.map(b => ({ id: b._id.toString(), confirmationCode: b.confirmationCode, userId: b.userId, hotel: b.hotel as any, room: b.room as any, checkIn: b.checkIn, checkOut: b.checkOut, guests: b.guests, totalAmount: b.totalAmount, currency: b.currency, status: b.status as any, paymentStatus: b.paymentStatus as any, createdAt: b.createdAt }));
  }

  async orderRoomService(bookingId: string, items: { name: string; quantity: number; price: number }[]): Promise<RoomServiceOrder> {
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = new RoomServiceModel({ bookingId, items, totalAmount, status: 'pending' });
    await order.save();
    return { id: order._id.toString(), bookingId: order.bookingId, items: order.items as any, totalAmount: order.totalAmount, status: order.status as any, createdAt: order.createdAt };
  }

  async cancelBooking(bookingId: string): Promise<HotelBooking | null> {
    const b = await HotelBookingModel.findByIdAndUpdate(bookingId, { status: 'cancelled', paymentStatus: 'refunded' }, { new: true });
    return b ? { id: b._id.toString(), confirmationCode: b.confirmationCode, userId: b.userId, hotel: b.hotel as any, room: b.room as any, checkIn: b.checkIn, checkOut: b.checkOut, guests: b.guests, totalAmount: b.totalAmount, currency: b.currency, status: b.status as any, paymentStatus: b.paymentStatus as any, createdAt: b.createdAt } : null;
  }
}

export const hotelService = new HotelService();
export default hotelService;