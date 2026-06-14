/**
 * REZ Ecosystem Integrations for PeopleOS
 *
 * Connects PeopleOS to:
 * - RABTUL Platform (Auth, Wallet, Notifications)
 * - REZ Intelligence (Identity, Segments, Predictions)
 * - REZ Media (Corporate Karma)
 */

import axios from 'axios';

// Configuration
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const WALLET_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const PROFILE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:4013';
const INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018';

// Types
interface Employee {
  employeeId: string;
  email: string;
  phone: string;
  name: string;
  companyId: string;
  department: string;
  role: string;
}

interface EngagementScore {
  employeeId: string;
  score: number;
  factors: { factor: string; contribution: number }[];
  recommendations: string[];
}

interface RetentionRisk {
  employeeId: string;
  riskLevel: 'low' | 'medium' | 'high';
  probability: number;
  factors: string[];
}

class PeopleOSIntegrations {
  /**
   * Onboard a new employee with full ecosystem integration
   */
  async onboardEmployee(employee: Employee): Promise<void> {
    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    };

    // 1. Create RABTUL Auth account
    await axios.post(
      `${AUTH_URL}/api/auth/send-otp`,
      { phone: employee.phone },
      { headers }
    );

    // 2. Create RABTUL Profile
    await axios.post(
      `${PROFILE_URL}/api/profiles/create`,
      {
        userId: employee.employeeId,
        email: employee.email,
        phone: employee.phone,
        name: employee.name,
        metadata: {
          companyId: employee.companyId,
          department: employee.department,
          role: employee.role,
        },
      },
      { headers }
    );

    // 3. Initialize RABTUL Wallet with welcome bonus
    await axios.post(
      `${WALLET_URL}/api/wallet/add`,
      {
        userId: employee.employeeId,
        amount: 1000, // Welcome bonus coins
        reason: 'welcome_bonus',
        metadata: { source: 'peopleos_onboarding' },
      },
      { headers }
    );

    // 4. Create employee identity in REZ Intelligence
    await axios.post(
      `${INTELLIGENCE_URL}/api/identity/create`,
      {
        userId: employee.employeeId,
        identifiers: [
          { type: 'email', value: employee.email },
          { type: 'phone', value: employee.phone },
        ],
        metadata: {
          companyId: employee.companyId,
          department: employee.department,
        },
      },
      { headers }
    );

    // 5. Send welcome notification
    await axios.post(
      `${NOTIFICATION_URL}/api/notifications/send`,
      {
        userId: employee.employeeId,
        type: 'email',
        title: 'Welcome to PeopleOS!',
        message: `Welcome ${employee.name}! Your onboarding checklist is ready.`,
        data: { type: 'onboarding' },
      },
      { headers }
    );
  }

  /**
   * Get employee engagement score from REZ Intelligence
   */
  async getEngagementScore(employeeId: string): Promise<EngagementScore> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/predict/engagement`,
        { userId: employeeId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Engagement score failed:', error);
      return {
        employeeId,
        score: 0,
        factors: [],
        recommendations: [],
      };
    }
  }

  /**
   * Predict employee retention risk
   */
  async predictRetentionRisk(employeeId: string): Promise<RetentionRisk> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/predict/retention`,
        { userId: employeeId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Retention prediction failed:', error);
      return {
        employeeId,
        riskLevel: 'medium',
        probability: 0.5,
        factors: [],
      };
    }
  }

  /**
   * Award Corporate Karma to an employee
   */
  async awardKarma(employeeId: string, managerId: string, points: number, reason: string): Promise<void> {
    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    };

    // Add coins to employee wallet
    await axios.post(
      `${WALLET_URL}/api/wallet/add`,
      {
        userId: employeeId,
        amount: points,
        reason: `karma_recognition`,
        metadata: { awardedBy: managerId, reason },
      },
      { headers }
    );

    // Send notification
    await axios.post(
      `${NOTIFICATION_URL}/api/notifications/send`,
      {
        userId: employeeId,
        type: 'push',
        title: 'You received Karma!',
        message: `You earned ${points} Karma points: ${reason}`,
        data: { type: 'karma_awarded', points, managerId },
      },
      { headers }
    );
  }

  /**
   * Get personalized learning recommendations
   */
  async getLearningRecommendations(employeeId: string): Promise<string[]> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/recommend/learning`,
        { userId: employeeId, limit: 5 },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data.courses;
    } catch (error) {
      logger.error('Learning recommendations failed:', error);
      return [];
    }
  }

  /**
   * Get employee segments for personalized features
   */
  async getEmployeeSegments(employeeId: string): Promise<string[]> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/segments/user`,
        { userId: employeeId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data.segments;
    } catch (error) {
      logger.error('Get segments failed:', error);
      return [];
    }
  }

  /**
   * Send company-wide announcement
   */
  async sendCompanyAnnouncement(companyId: string, title: string, message: string): Promise<void> {
    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    };

    // Get all employees in company
    // This would typically call the PeopleOS employee service
    const employees = await this.getCompanyEmployees(companyId);

    // Send bulk notification
    await axios.post(
      `${NOTIFICATION_URL}/api/notifications/send-bulk`,
      {
        userIds: employees.map(e => e.employeeId),
        type: 'push',
        title,
        message,
        data: { type: 'announcement', companyId },
      },
      { headers }
    );
  }

  /**
   * Award coins for goal completion
   */
  async awardGoalBonus(employeeId: string, goalId: string, points: number): Promise<void> {
    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    };

    await axios.post(
      `${WALLET_URL}/api/wallet/add`,
      {
        userId: employeeId,
        amount: points,
        reason: `goal_completed_${goalId}`,
        metadata: { goalId },
      },
      { headers }
    );
  }

  /**
   * Helper: Get all employees in a company
   */
  private async getCompanyEmployees(companyId: string): Promise<Employee[]> {
    // This would be replaced with actual PeopleOS database call
    return [];
  }
}

export const peopleOSIntegrations = new PeopleOSIntegrations();
export default peopleOSIntegrations;
