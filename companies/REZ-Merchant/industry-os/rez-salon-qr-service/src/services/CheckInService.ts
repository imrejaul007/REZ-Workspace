import { v4 as uuidv4 } from 'uuid';
import { CheckIn, ICheckIn, CustomerTier } from '../models/CheckIn';
import { LoyaltyPoints, ILoyaltyPoints } from '../models/LoyaltyPoints';
import { qrService, QRPayload } from './QRService';
import { LoyaltyService } from './LoyaltyService';

export interface CheckInResult {
  success: boolean;
  checkInId?: string;
  customerId: string;
  pointsEarned: number;
  tier: CustomerTier;
  totalPoints: number;
  isBirthdayBonus: boolean;
  waitTimeMinutes: number;
  message: string;
}

export interface WaitTimeEstimate {
  currentQueue: number;
  estimatedWaitMinutes: number;
  averageServiceMinutes: number;
}

export class CheckInService {
  private loyaltyService: LoyaltyService;

  constructor() {
    this.loyaltyService = new LoyaltyService();
  }

  /**
   * Verify and decode a scanned QR code
   */
  verifyQRCode(qrData: string): QRPayload | null {
    return qrService.verifyPayload(qrData);
  }

  /**
   * Process a customer check-in from QR scan
   */
  async processCheckIn(
    qrData: string,
    customerId: string,
    customerName: string,
    customerPhone: string,
    salonId: string
  ): Promise<CheckInResult> {
    // Verify QR code
    const payload = this.verifyQRCode(qrData);
    if (!payload) {
      return {
        success: false,
        customerId,
        pointsEarned: 0,
        tier: CustomerTier.SILVER,
        totalPoints: 0,
        isBirthdayBonus: false,
        waitTimeMinutes: 0,
        message: 'Invalid or expired QR code',
      };
    }

    // Verify salon matches
    if (payload.salonId !== salonId) {
      return {
        success: false,
        customerId,
        pointsEarned: 0,
        tier: CustomerTier.SILVER,
        totalPoints: 0,
        isBirthdayBonus: false,
        waitTimeMinutes: 0,
        message: 'QR code does not match this salon',
      };
    }

    // Check for duplicate check-in (within last hour)
    const recentCheckIn = await CheckIn.findOne({
      customerId,
      salonId: payload.salonId,
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      status: 'active',
    });

    if (recentCheckIn) {
      return {
        success: false,
        customerId,
        pointsEarned: 0,
        tier: CustomerTier.SILVER,
        totalPoints: 0,
        isBirthdayBonus: false,
        waitTimeMinutes: 0,
        message: 'You have already checked in recently',
      };
    }

    // Get or create loyalty record
    let loyalty = await LoyaltyPoints.findOne({ customerId });
    if (!loyalty) {
      loyalty = await this.loyaltyService.createLoyaltyAccount(customerId, customerName, customerPhone);
    }

    // Calculate points and check for birthday bonus
    const { pointsEarned, isBirthdayBonus, newTier } = await this.loyaltyService.calculateCheckInPoints(
      loyalty,
      customerId
    );

    // Calculate wait time
    const waitTime = await this.estimateWaitTime(payload.salonId);

    // Create check-in record
    const checkInId = uuidv4();
    const checkIn = new CheckIn({
      checkInId,
      salonId: payload.salonId,
      customerId,
      customerName,
      customerPhone,
      pointsEarned,
      tier: newTier,
      isBirthdayBonus,
      waitTimeMinutes: waitTime.estimatedWaitMinutes,
      status: 'active',
    });

    await checkIn.save();

    // Update loyalty points
    await this.loyaltyService.addPoints(customerId, pointsEarned, checkInId);

    return {
      success: true,
      checkInId,
      customerId,
      pointsEarned,
      tier: newTier,
      totalPoints: loyalty.availablePoints + pointsEarned,
      isBirthdayBonus,
      waitTimeMinutes: waitTime.estimatedWaitMinutes,
      message: this.buildCheckInMessage(pointsEarned, newTier, isBirthdayBonus),
    };
  }

  /**
   * Complete a check-in (customer leaves)
   */
  async completeCheckIn(checkInId: string): Promise<ICheckIn | null> {
    const checkIn = await CheckIn.findOneAndUpdate(
      { checkInId, status: 'active' },
      { status: 'completed' },
      { new: true }
    );
    return checkIn;
  }

  /**
   * Cancel a check-in
   */
  async cancelCheckIn(checkInId: string): Promise<ICheckIn | null> {
    const checkIn = await CheckIn.findOneAndUpdate(
      { checkInId, status: 'active' },
      { status: 'cancelled' },
      { new: true }
    );
    return checkIn;
  }

  /**
   * Estimate wait time based on current queue
   */
  async estimateWaitTime(salonId: string): Promise<WaitTimeEstimate> {
    // Get active check-ins for the salon
    const activeCheckIns = await CheckIn.countDocuments({
      salonId,
      status: 'active',
      timestamp: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // Last 4 hours
    });

    // Assume average service time of 30 minutes per customer
    const averageServiceMinutes = 30;
    const estimatedWaitMinutes = activeCheckIns * averageServiceMinutes;

    return {
      currentQueue: activeCheckIns,
      estimatedWaitMinutes,
      averageServiceMinutes,
    };
  }

  /**
   * Get check-in history for a customer
   */
  async getCheckInHistory(
    customerId: string,
    limit = 20,
    offset = 0
  ): Promise<{ checkIns: ICheckIn[]; total: number }> {
    const [checkIns, total] = await Promise.all([
      CheckIn.find({ customerId })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit),
      CheckIn.countDocuments({ customerId }),
    ]);

    return { checkIns, total };
  }

  /**
   * Get current queue for a salon
   */
  async getSalonQueue(salonId: string): Promise<ICheckIn[]> {
    return CheckIn.find({
      salonId,
      status: 'active',
      timestamp: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    }).sort({ timestamp: 1 });
  }

  private buildCheckInMessage(pointsEarned: number, tier: CustomerTier, isBirthdayBonus: boolean): string {
    let message = `Welcome! You earned ${pointsEarned} points.`;

    if (isBirthdayBonus) {
      message += ' Happy Birthday! Bonus points applied!';
    }

    switch (tier) {
      case CustomerTier.PLATINUM:
        message += ' Enjoy your Platinum benefits!';
        break;
      case CustomerTier.GOLD:
        message += ' Keep checking in to reach Platinum!';
        break;
      case CustomerTier.SILVER:
        message += ' Reach Gold tier with 10 more visits!';
        break;
    }

    return message;
  }
}

export const checkInService = new CheckInService();
