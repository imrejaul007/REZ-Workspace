/**
 * Access Service
 * QR card generation and validation
 */

import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { AccessCard, IAccessCard } from '../models/accessCard';
import { CheckIn } from '../models/checkIn';

export interface GenerateCardParams {
  memberId: string;
  gymId: string;
  memberName: string;
  planName: string;
  validUntil: Date;
}

export interface CheckInResult {
  success: boolean;
  message: string;
  member?: {
    id: string;
    name: string;
    plan: string;
  };
  checkIn?: {
    id: string;
    time: Date;
  };
  occupancy?: number;
}

export async function generateAccessCard(params: GenerateCardParams): Promise<IAccessCard> {
  const cardNumber = `FIT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const qrCode = uuidv4();

  const qrData = JSON.stringify({
    type: 'fitness_access',
    cardNumber,
    qrCode,
    memberId: params.memberId,
    gymId: params.gymId,
    validUntil: params.validUntil.toISOString(),
  });

  const qrCodeUrl = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: { dark: '#1e293b', light: '#ffffff' },
  });

  const card = new AccessCard({
    memberId: params.memberId,
    gymId: params.gymId,
    cardNumber,
    qrCode,
    qrCodeUrl,
    validFrom: new Date(),
    validUntil: params.validUntil,
    status: 'active',
  });

  await card.save();
  return card;
}

export async function validateAndCheckIn(qrCode: string, gymId: string): Promise<CheckInResult> {
  // Find the card
  const card = await AccessCard.findOne({ qrCode });

  if (!card) {
    return { success: false, message: 'Invalid QR code' };
  }

  // Check if card belongs to this gym
  if (card.gymId !== gymId) {
    return { success: false, message: 'Card not valid for this gym' };
  }

  // Check card status
  if (card.status !== 'active') {
    return { success: false, message: `Card is ${card.status}` };
  }

  // Check validity
  const now = new Date();
  if (now > card.validUntil) {
    card.status = 'expired';
    await card.save();
    return { success: false, message: 'Card has expired' };
  }

  // Check if already checked in
  const activeCheckIn = await CheckIn.findOne({
    cardId: card._id.toString(),
    status: 'active',
  });

  if (activeCheckIn) {
    // Check out instead
    activeCheckIn.checkOutTime = now;
    activeCheckIn.duration = Math.round((now.getTime() - activeCheckIn.checkInTime.getTime()) / 60000);
    activeCheckIn.status = 'completed';
    await activeCheckIn.save();

    card.useCount += 1;
    await card.save();

    const currentOccupancy = await CheckIn.countDocuments({
      gymId,
      status: 'active',
      checkInTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    return {
      success: true,
      message: 'Check-out successful',
      checkIn: {
        id: activeCheckIn._id.toString(),
        time: now,
      },
      occupancy: currentOccupancy,
    };
  }

  // Create new check-in
  const checkIn = new CheckIn({
    memberId: card.memberId,
    gymId,
    cardId: card._id.toString(),
    checkInTime: now,
    type: 'check-in',
    status: 'active',
  });
  await checkIn.save();

  // Update card
  card.lastUsed = now;
  card.useCount += 1;
  await card.save();

  // Get current occupancy
  const currentOccupancy = await CheckIn.countDocuments({
    gymId,
    status: 'active',
    checkInTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  });

  return {
    success: true,
    message: 'Check-in successful',
    member: {
      id: card.memberId,
      name: 'Member', // Would fetch from member service
      plan: 'Premium',
    },
    checkIn: {
      id: checkIn._id.toString(),
      time: now,
    },
    occupancy: currentOccupancy,
  };
}

export async function getCardStatus(memberId: string): Promise<IAccessCard | null> {
  return AccessCard.findOne({ memberId, status: 'active' }).sort({ issuedAt: -1 });
}

export async function suspendCard(cardId: string, reason: string): Promise<IAccessCard | null> {
  return AccessCard.findByIdAndUpdate(cardId, { status: 'suspended' }, { new: true });
}

export async function reactivateCard(cardId: string): Promise<IAccessCard | null> {
  return AccessCard.findByIdAndUpdate(cardId, { status: 'active' }, { new: true });
}

export async function reportLostCard(cardId: string): Promise<IAccessCard | null> {
  return AccessCard.findByIdAndUpdate(cardId, { status: 'lost' }, { new: true });
}

export async function getGymOccupancy(gymId: string): Promise<{ current: number; capacity: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = await CheckIn.countDocuments({
    gymId,
    status: 'active',
    checkInTime: { $gte: today },
  });

  // Capacity would come from gym settings - using default
  const capacity = 100;

  return { current, capacity };
}

export async function getMemberHistory(
  memberId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ICheckIn[]> {
  const query: Record<string, unknown> = { memberId };

  if (startDate || endDate) {
    query.checkInTime = {};
    if (startDate) (query.checkInTime as Record<string, Date>).$gte = startDate;
    if (endDate) (query.checkInTime as Record<string, Date>).$lte = endDate;
  }

  return CheckIn.find(query).sort({ checkInTime: -1 });
}
