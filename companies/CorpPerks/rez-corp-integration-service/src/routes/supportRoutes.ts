/**
 * REZ Care - CorpPerks Integration
 *
 * Connects REZ Care to CorpPerks for HR support, training, etc.
 */

import axios from 'axios';
import { logger } from '../utils/logger';

// CorpPerks Service URLs
const CORPPERKS_URLS = {
  corporate: process.env.CORPPERKS_CORPORATE_URL || 'http://localhost:5001',
  peopleos: process.env.CORPPERKS_PEOPLEOS_URL || 'http://localhost:5002',
  talent: process.env.CORPPERKS_TALENT_URL || 'http://localhost:5003',
  restopapa: process.env.CORPPERKS_RESTOPAPA_URL || 'http://localhost:5004',
  insightcampus: process.env.CORPPERKS_INSIGHT_URL || 'http://localhost:5005',
};

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token';

export interface CorpPerksEmployee {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  company: string;
}

class CorpPerksIntegration {
  private headers = {
    'Content-Type': 'application/json',
    'X-Internal-Token': INTERNAL_TOKEN,
  };

  /**
   * Get employee by ID
   */
  async getEmployee(employeeId: string): Promise<CorpPerksEmployee | null> {
    try {
      const res = await axios.get(`${CORPPERKS_URLS.corporate}/employees/${employeeId}`, {
        headers: this.headers,
        timeout: 5000,
      });
      return res.data;
    } catch (error) {
      logger.warn('[CorpPerks] Failed to get employee', error);
      return null;
    }
  }

  /**
   * Get employee by email
   */
  async getEmployeeByEmail(email: string): Promise<CorpPerksEmployee | null> {
    try {
      const res = await axios.get(`${CORPPERKS_URLS.corporate}/employees/email/${encodeURIComponent(email)}`, {
        headers: this.headers,
        timeout: 5000,
      });
      return res.data;
    } catch {
      return null;
    }
  }

  /**
   * Create leave request from support ticket
   */
  async createLeaveRequest(employeeId: string, data: {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<{ success: boolean; leaveId?: string }> {
    try {
      const res = await axios.post(
        `${CORPPERKS_URLS.peopleos}/leave/request`,
        { employeeId, ...data },
        { headers: this.headers, timeout: 10000 }
      );
      return { success: true, leaveId: res.data?.id };
    } catch (error) {
      logger.error('[CorpPerks] Leave request failed', error);
      return { success: false };
    }
  }

  /**
   * Submit expense from support ticket
   */
  async submitExpense(employeeId: string, data: {
    category: string;
    amount: number;
    description: string;
    receipts?: string[];
  }): Promise<{ success: boolean; expenseId?: string }> {
    try {
      const res = await axios.post(
        `${CORPPERKS_URLS.peopleos}/expenses/submit`,
        { employeeId, ...data },
        { headers: this.headers, timeout: 10000 }
      );
      return { success: true, expenseId: res.data?.id };
    } catch {
      return { success: false };
    }
  }

  /**
   * Get payroll status
   */
  async getPayrollStatus(employeeId: string): Promise<any> {
    try {
      const res = await axios.get(
        `${CORPPERKS_URLS.peopleos}/payroll/${employeeId}/status`,
        { headers: this.headers, timeout: 5000 }
      );
      return res.data;
    } catch {
      return null;
    }
  }

  /**
   * Submit leave appeal
   */
  async submitLeaveAppeal(employeeId: string, leaveId: string, reason: string): Promise<boolean> {
    try {
      await axios.post(
        `${CORPPERKS_URLS.peopleos}/leave/${leaveId}/appeal`,
        { employeeId, reason },
        { headers: this.headers }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get training course recommendations
   */
  async getTrainingRecommendations(employeeId: string): Promise<string[]> {
    try {
      const res = await axios.get(
        `${CORPPORTAL_URLS.talent}/recommendations/${employeeId}`,
        { headers: this.headers, timeout: 5000 }
      );
      return res.data?.courses || [];
    } catch {
      return [];
    }
  }

  /**
   * Enroll in training
   */
  async enrollInTraining(employeeId: string, courseId: string): Promise<boolean> {
    try {
      await axios.post(
        `${CORPPERKS_URLS.talent}/enroll`,
        { employeeId, courseId },
        { headers: this.headers }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get restaurant metrics for RestoPapa
   */
  async getRestaurantMetrics(restaurantId: string): Promise<any> {
    try {
      const res = await axios.get(
        `${CORPPERKS_URLS.restopapa}/metrics/${restaurantId}`,
        { headers: this.headers, timeout: 5000 }
      );
      return res.data;
    } catch {
      return null;
    }
  }

  /**
   * Trigger restaurant quality review
   */
  async triggerRestaurantReview(restaurantId: string, ticketId: string): Promise<boolean> {
    try {
      await axios.post(
        `${CORPPERKS_URLS.restopapa}/quality-review`,
        { restaurantId, ticketId },
        { headers: this.headers }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get student progress (Insight Campus)
   */
  async getStudentProgress(studentId: string): Promise<any> {
    try {
      const res = await axios.get(
        `${CORPPERKS_URLS.insightcampus}/progress/${studentId}`,
        { headers: this.headers, timeout: 5000 }
      );
      return res.data;
    } catch {
      return null;
    }
  }

  /**
   * Enroll student in course
   */
  async enrollStudent(studentId: string, courseId: string): Promise<boolean> {
    try {
      await axios.post(
        `${CORPPERKS_URLS.insightcampus}/enroll`,
        { studentId, courseId },
        { headers: this.headers }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Route support ticket to correct CorpPerks service
   */
  async routeTicket(ticket: {
    ticketId: string;
    platform: string;
    category: string;
    customerId: string;
    message: string;
  }): Promise<{
    routed: boolean;
    service: string;
    action?: string;
  }> {
    const platform = ticket.platform.toLowerCase();

    // Route to PeopleOS for HR issues
    if (['leave', 'payroll', 'expense', 'attendance', 'hr', 'peopleos'].some(k => platform.includes(k))) {
      return { routed: true, service: 'peopleos', action: 'route_hr_agent' };
    }

    // Route to TalentAI for learning/certification
    if (['course', 'training', 'talent', 'certification'].some(k => ticket.category?.includes(k))) {
      return { routed: true, service: 'talentai', action: 'suggest_courses' };
    }

    // Route to RestoPapa for restaurant support
    if (ticket.category?.includes('restaurant') || platform.includes('restopapa')) {
      return { routed: true, service: 'restopapa', action: 'route_restaurant_support' };
    }

    // Route to Insight Campus for education
    if (ticket.category?.includes('course') || platform.includes('insight')) {
      return { routed: true, service: 'insightcampus', action: 'route_student_support' };
    }

    return { routed: false, service: 'unknown' };
  }

  /**
   * Full CorpPerks context enrichment
   */
  async enrichContext(customerId: string): Promise<any> {
    const [employee, payroll, training] = await Promise.all([
      this.getEmployee(customerId),
      this.getPayrollStatus(customerId),
      this.getTrainingRecommendations(customerId),
    ]);

    return { employee, payroll, training };
  }
}

export const corpPerksIntegration = new CorpPerksIntegration();
export { CorpPerksIntegration };
