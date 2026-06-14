import mongoose, { Document, Schema } from 'mongoose';

export const AttendanceType = {
  CHECK_IN: 'check_in',
  CHECK_OUT: 'check_out',
  CLASS: 'class',
  FACILITY: 'facility'
} as const;

export type AttendanceTypeValue = typeof AttendanceType[keyof typeof AttendanceType];

export interface IAttendance extends Document {
  memberId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  type: AttendanceTypeValue;
  checkInTime: Date;
  checkOutTime?: Date;
  duration?: number; // in minutes
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'FitnessClass' },
  type: {
    type: String,
    enum: ['check_in', 'check_out', 'class', 'facility'],
    required: true
  },
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date },
  duration: { type: Number },
  notes: { type: String }
}, { timestamps: true });

attendanceSchema.index({ memberId: 1, checkInTime: -1 });
attendanceSchema.index({ classId: 1 });
attendanceSchema.index({ checkInTime: -1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);

// Billing Model
export const BillingStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
} as const;

export type BillingStatusValue = typeof BillingStatus[keyof typeof BillingStatus];

export interface IBilling extends Document {
  memberId: mongoose.Types.ObjectId;
  membershipId?: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: BillingStatusValue;
  description: string;
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  invoiceNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const billingSchema = new Schema<IBilling>({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  membershipId: { type: Schema.Types.ObjectId, ref: 'Membership' },
  classId: { type: Schema.Types.ObjectId, ref: 'FitnessClass' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  paymentMethod: { type: String },
  transactionId: { type: String },
  invoiceNumber: { type: String, required: true, unique: true }
}, { timestamps: true });

billingSchema.index({ memberId: 1 });
billingSchema.index({ status: 1 });
billingSchema.index({ dueDate: 1 });

export const Billing = mongoose.model<IBilling>('Billing', billingSchema);

export class AttendanceService {
  async checkIn(memberId: string, data: {
    classId?: string;
    type?: AttendanceTypeValue;
    notes?: string;
  }): Promise<IAttendance> {
    const attendance = new Attendance({
      memberId,
      classId: data.classId,
      type: data.type || (data.classId ? AttendanceType.CLASS : AttendanceType.FACILITY),
      checkInTime: new Date(),
      notes: data.notes
    });

    return attendance.save();
  }

  async checkOut(memberId: string, attendanceId: string): Promise<IAttendance | null> {
    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    attendance.checkOutTime = new Date();
    attendance.duration = Math.round(
      (attendance.checkOutTime.getTime() - attendance.checkInTime.getTime()) / 60000
    );

    return attendance.save();
  }

  async getMemberAttendance(
    memberId: string,
    options: { startDate?: string; endDate?: string; limit?: number } = {}
  ): Promise<IAttendance[]> {
    const query: unknown = { memberId };

    if (options.startDate || options.endDate) {
      query.checkInTime = {};
      if (options.startDate) {
        query.checkInTime.$gte = new Date(options.startDate);
      }
      if (options.endDate) {
        query.checkInTime.$lte = new Date(options.endDate);
      }
    }

    return Attendance.find(query)
      .populate('classId')
      .sort({ checkInTime: -1 })
      .limit(options.limit || 50);
  }

  async getClassAttendance(classId: string): Promise<IAttendance[]> {
    return Attendance.find({ classId, type: AttendanceType.CLASS })
      .populate('memberId', 'firstName lastName email phone')
      .sort({ checkInTime: 1 });
  }

  async getDailyAttendance(date: string): Promise<IAttendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Attendance.find({
      checkInTime: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('memberId', 'firstName lastName email phone')
      .sort({ checkInTime: -1 });
  }

  async getAttendanceStats(memberId: string, days: number = 30): Promise<{
    totalVisits: number;
    totalDuration: number;
    averageDuration: number;
    lastVisit: Date | null;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const records = await Attendance.find({
      memberId,
      checkInTime: { $gte: startDate }
    });

    const totalVisits = records.length;
    const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0);

    return {
      totalVisits,
      totalDuration,
      averageDuration: totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0,
      lastVisit: records[0]?.checkInTime || null
    };
  }
}

export class BillingService {
  private generateInvoiceNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${timestamp}-${random}`;
  }

  async createBilling(data: {
    memberId: string;
    membershipId?: string;
    classId?: string;
    amount: number;
    description: string;
    dueDate: Date;
    currency?: string;
  }): Promise<IBilling> {
    const billing = new Billing({
      ...data,
      invoiceNumber: this.generateInvoiceNumber(),
      status: BillingStatus.PENDING
    });

    return billing.save();
  }

  async getMemberBilling(memberId: string, options: { status?: string } = {}): Promise<IBilling[]> {
    const query: unknown = { memberId };

    if (options.status) {
      query.status = options.status;
    }

    return Billing.find(query).sort({ createdAt: -1 });
  }

  async markAsPaid(id: string, paymentData: {
    paymentMethod: string;
    transactionId: string;
  }): Promise<IBilling | null> {
    return Billing.findByIdAndUpdate(
      id,
      {
        $set: {
          status: BillingStatus.PAID,
          paidDate: new Date(),
          paymentMethod: paymentData.paymentMethod,
          transactionId: paymentData.transactionId
        }
      },
      { new: true }
    );
  }

  async markAsFailed(id: string): Promise<IBilling | null> {
    return Billing.findByIdAndUpdate(
      id,
      { $set: { status: BillingStatus.FAILED } },
      { new: true }
    );
  }

  async refund(id: string): Promise<IBilling | null> {
    return Billing.findByIdAndUpdate(
      id,
      { $set: { status: BillingStatus.REFUNDED } },
      { new: true }
    );
  }

  async getPendingBilling(): Promise<IBilling[]> {
    return Billing.find({
      status: BillingStatus.PENDING,
      dueDate: { $lte: new Date() }
    }).populate('memberId', 'firstName lastName email phone');
  }

  async getOverdueBilling(): Promise<IBilling[]> {
    return Billing.find({
      status: BillingStatus.PENDING,
      dueDate: { $lt: new Date() }
    }).populate('memberId', 'firstName lastName email phone');
  }
}

export const attendanceService = new AttendanceService();
export const billingService = new BillingService();
