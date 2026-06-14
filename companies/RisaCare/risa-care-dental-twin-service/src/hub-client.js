/**
 * Dental Twin Hub Client
 *
 * Connects Dental Twin to REZ ecosystem:
 * - Genie Memory for dental health context
 * - HOJAI Clinic AI for clinical support
 * - Nexha for dental supplies
 * - SUTAR GoalOS for expansion
 */

const axios = require('axios');

const SERVICES = {
  // HOJAI AI
  HOJAI_GATEWAY: process.env.HOJAI_GATEWAY || 'http://localhost:4500',
  HOJAI_CLINIC_AI: process.env.HOJAI_CLINIC_AI || 'http://localhost:4501',

  // Genie Memory
  GENIE_MEMORY: process.env.GENIE_MEMORY || 'http://localhost:4703',
  GENIE_BRIEFING: process.env.GENIE_BRIEFING || 'http://localhost:4706',

  // Nexha
  NEXHA_GATEWAY: process.env.NEXHA_GATEWAY || 'http://localhost:5002',
  PROCUREMENT_OS: process.env.PROCUREMENT_OS || 'http://localhost:4320',

  // SUTAR
  SUTAR_GOAL_OS: process.env.SUTAR_GOAL_OS || 'http://localhost:4242',

  // RisaCare
  RISA_CARE_HUB: process.env.RISA_CARE_HUB || 'http://localhost:4600',
  PATIENT_TWIN: process.env.PATIENT_TWIN || 'http://localhost:8643',

  // RABTUL
  AUTH_SERVICE: process.env.AUTH_SERVICE || 'https://rez-auth-service.onrender.com',
};

class DentalTwinHubClient {
  constructor() {
    this.clients = {};
    this.initClients();
  }

  initClients() {
    Object.entries(SERVICES).forEach(([name, url]) => {
      this.clients[name] = axios.create({
        baseURL: url,
        timeout: 10000
      });
    });
  }

  /**
   * Store dental memory in Genie
   */
  async storeDentalMemory(patientId, memory) {
    try {
      const response = await this.clients.GENIE_MEMORY.post('/api/memories', {
        corpId: patientId,
        type: 'episodic',
        category: 'dental',
        ...memory
      });
      return response.data;
    } catch (error) {
      console.error('Failed to store dental memory:', error.message);
      return null;
    }
  }

  /**
   * Get dental context from Genie
   */
  async getDentalContext(patientId) {
    try {
      const response = await this.clients.GENIE_MEMORY.get(`/api/memories/${patientId}`, {
        params: { category: 'dental' }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get dental context:', error.message);
      return null;
    }
  }

  /**
   * Send dental reminder via Genie Briefing
   */
  async sendDentalReminder(patientId, reminder) {
    try {
      const response = await this.clients.GENIE_BRIEFING.post('/api/reminders', {
        corpId: patientId,
        type: 'health_reminder',
        category: 'dental',
        title: reminder.title || 'Dental Checkup Due',
        message: reminder.message,
        action: {
          type: 'book_appointment',
          service: 'dental',
          clinicId: reminder.clinicId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send dental reminder:', error.message);
      return null;
    }
  }

  /**
   * Analyze dental X-ray via HOJAI Clinic AI
   */
  async analyzeXRay(imageUrl, toothNumbers) {
    try {
      const response = await this.clients.HOJAI_CLINIC_AI.post('/api/analyze/dental', {
        imageUrl,
        toothNumbers,
        analysisType: 'dental_xray'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to analyze X-ray:', error.message);
      return null;
    }
  }

  /**
   * Order dental supplies via Nexha
   */
  async orderDentalSupplies(order) {
    try {
      const response = await this.clients.PROCUREMENT_OS.post('/api/orders', {
        category: 'dental_supplies',
        items: order.items,
        supplierPreferences: order.supplierPreferences
      });
      return response.data;
    } catch (error) {
      console.error('Failed to order supplies:', error.message);
      return null;
    }
  }

  /**
   * Check dental supplies inventory via Nexha
   */
  async checkSuppliesInventory(clinicId) {
    try {
      const response = await this.clients.PROCUREMENT_OS.get('/api/inventory/dental', {
        params: { clinicId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to check inventory:', error.message);
      return null;
    }
  }

  /**
   * Create expansion goal via SUTAR
   */
  async createExpansionGoal(clinicOwnerId, goal) {
    try {
      const response = await this.clients.SUTAR_GOAL_OS.post('/api/goals', {
        title: goal.title,
        priority: goal.priority || 'critical',
        owner: clinicOwnerId,
        category: 'dental_expansion',
        subGoals: goal.subGoals || [],
        metadata: {
          type: 'dental_clinic_expansion',
          targetCount: goal.targetCount,
          timeline: goal.timeline
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create expansion goal:', error.message);
      return null;
    }
  }

  /**
   * Sync with Patient Twin
   */
  async syncWithPatientTwin(patientId, dentalData) {
    try {
      const response = await this.clients.PATIENT_TWIN.post('/api/sync/dental', {
        patientId,
        dentalSummary: dentalData
      });
      return response.data;
    } catch (error) {
      console.error('Failed to sync with Patient Twin:', error.message);
      return null;
    }
  }
}

module.exports = new DentalTwinHubClient();
