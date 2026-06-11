/**
 * Merchant OS Connector
 * Connects FITMIND to Merchant OS (REZ or Standalone)
 * Fitness and Wellness Platform
 */

export interface MerchantOSConfig {
  baseUrl: string;
  apiKey: string;
  type: 'rez' | 'standalone';
}

export interface MemberProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  membershipType: 'basic' | 'premium' | 'pro' | 'corporate';
  membershipStart: string;
  membershipEnd: string;
  fitnessGoals?: string[];
  injuries?: string[];
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface WorkoutPlan {
  id: string;
  memberId: string;
  name: string;
  description: string;
  durationWeeks: number;
  workouts: Array<{
    day: number;
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      duration?: number;
      restSeconds?: number;
    }>;
  }>;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  checkIn: string;
  checkOut?: string;
  workoutType?: string;
}

export interface BillingRecord {
  id: string;
  memberId: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'netbanking';
  dueDate: string;
  description: string;
}

export class MerchantOSConnector {
  private config: MerchantOSConfig;

  constructor(config: MerchantOSConfig) {
    this.config = config;
  }

  /**
   * Get member by phone
   */
  async getMemberByPhone(phone: string): Promise<MemberProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/members/phone/${phone}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get member by phone');
      return null;
    }
  }

  /**
   * Get member by ID
   */
  async getMemberById(memberId: string): Promise<MemberProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/members/${memberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to get member by ID');
      return null;
    }
  }

  /**
   * Create or update member
   */
  async upsertMember(member: Omit<MemberProfile, 'id'>): Promise<MemberProfile | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(member)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to upsert member');
      return null;
    }
  }

  /**
   * Update member fitness profile
   */
  async updateMemberFitnessProfile(
    memberId: string,
    profile: {
      fitnessGoals?: string[];
      injuries?: string[];
      fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    }
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/members/${memberId}/fitness-profile`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(profile)
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get workout plans for member
   */
  async getWorkoutPlans(memberId: string): Promise<WorkoutPlan[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/workouts?memberId=${memberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.plans || [];
    } catch {
      return [];
    }
  }

  /**
   * Create workout plan
   */
  async createWorkoutPlan(plan: Omit<WorkoutPlan, 'id' | 'createdAt'>): Promise<WorkoutPlan | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/workouts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(plan)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to create workout plan');
      return null;
    }
  }

  /**
   * Check in member
   */
  async checkIn(memberId: string, workoutType?: string): Promise<AttendanceRecord | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/attendance/checkin`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ memberId, workoutType, checkIn: new Date().toISOString() })
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      console.error('Merchant OS: Failed to check in member');
      return null;
    }
  }

  /**
   * Check out member
   */
  async checkOut(attendanceId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/attendance/${attendanceId}/checkout`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ checkOut: new Date().toISOString() })
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get member attendance history
   */
  async getAttendanceHistory(memberId: string, limit: number = 30): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/attendance?memberId=${memberId}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.records || [];
    } catch {
      return [];
    }
  }

  /**
   * Get member billing
   */
  async getMemberBilling(memberId: string): Promise<BillingRecord[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/billing?memberId=${memberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.bills || [];
    } catch {
      return [];
    }
  }

  /**
   * Process payment
   */
  async processPayment(
    billingId: string,
    amount: number,
    method: 'cash' | 'card' | 'upi' | 'netbanking'
  ): Promise<{ success: boolean; transactionId?: string; message: string }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/billing/${billingId}/payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount, method })
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        transactionId: data.transactionId,
        message: data.message || (response.ok ? 'Payment successful' : 'Payment failed')
      };
    } catch {
      return { success: false, message: 'Payment processing failed' };
    }
  }

  /**
   * Get membership plans
   */
  async getMembershipPlans(): Promise<{
    id: string;
    name: string;
    type: string;
    price: number;
    duration: string;
    features: string[];
  }[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/memberships/plans`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      return data.plans || [];
    } catch {
      return [];
    }
  }

  /**
   * Get exercise library
   */
  async getExercises(category?: string): Promise<{
    id: string;
    name: string;
    category: string;
    muscleGroups: string[];
    difficulty: string;
    instructions: string[];
  }[]> {
    try {
      const url = category
        ? `${this.config.baseUrl}/api/exercises?category=${category}`
        : `${this.config.baseUrl}/api/exercises`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.exercises || [];
    } catch {
      return [];
    }
  }

  /**
   * Check connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default MerchantOSConnector;
