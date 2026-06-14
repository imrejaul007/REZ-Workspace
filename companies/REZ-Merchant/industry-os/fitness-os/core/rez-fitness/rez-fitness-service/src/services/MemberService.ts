import { Member, IMember, MemberStatusType } from '../models/Member';
import { MemberMembership, IMemberMembership, MembershipStatus } from '../models/Membership';
import mongoose from 'mongoose';
import { z } from 'zod';

const CreateMemberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional(),
  membershipId: z.string().optional(),
  notes: z.string().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  goals: z.array(z.string()).optional()
});

export class MemberService {
  async createMember(data: z.infer<typeof CreateMemberSchema>): Promise<IMember> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const member = new Member({
        ...data,
        joinedDate: new Date()
      });

      await member.save({ session });

      if (data.membershipId) {
        const membershipRecord = new MemberMembership({
          memberId: member._id,
          membershipId: data.membershipId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
          status: 'active'
        });
        await membershipRecord.save({ session });

        member.membershipId = data.membershipId as unknown;
        await member.save({ session });
      }

      await session.commitTransaction();
      return member;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getMemberById(id: string): Promise<IMember | null> {
    return Member.findById(id).populate('membershipId');
  }

  async getMemberByEmail(email: string): Promise<IMember | null> {
    return Member.findOne({ email: email.toLowerCase() });
  }

  async getAllMembers(options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<{ members: IMember[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20, status, search } = options;
    const query: unknown = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .populate('membershipId')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return {
      members,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateMember(id: string, data: Partial<z.infer<typeof CreateMemberSchema>>): Promise<IMember | null> {
    return Member.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('membershipId');
  }

  async updateMemberStatus(id: string, status: MemberStatusType): Promise<IMember | null> {
    return Member.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
  }

  async deleteMember(id: string): Promise<boolean> {
    const result = await Member.findByIdAndDelete(id);
    if (result) {
      await MemberMembership.deleteMany({ memberId: id });
      return true;
    }
    return false;
  }

  async assignMembership(memberId: string, membershipId: string, durationDays: number): Promise<IMemberMembership> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existing = await MemberMembership.findOne({
        memberId,
        status: 'active'
      }).session(session);

      if (existing) {
        existing.status = 'expired';
        await existing.save({ session });
      }

      const newMembership = new MemberMembership({
        memberId,
        membershipId,
        startDate: new Date(),
        endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        status: 'active'
      });

      await newMembership.save({ session });

      await Member.findByIdAndUpdate(memberId, { membershipId }, { session });

      await session.commitTransaction();
      return newMembership;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getMemberMembership(memberId: string): Promise<IMemberMembership | null> {
    return MemberMembership.findOne({
      memberId,
      status: 'active'
    }).populate('membershipId');
  }

  async getMemberAttendance(memberId: string): Promise<unknown[]> {
    // This would be implemented with Attendance model
    return [];
  }

  async getMemberBillingHistory(memberId: string): Promise<unknown[]> {
    // This would query billing records
    return [];
  }
}

export const memberService = new MemberService();
