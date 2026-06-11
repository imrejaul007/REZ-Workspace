/**
 * Phone Receptionist Voice Agent (IVR)
 * Handles inbound calls with intelligent routing and assistance
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { unifiedLeadService } from '../../services/unified-lead-service';
import { customer360Service } from '../../services/customer-360-service';
import { hojaiCore, IndustryType } from '../../connectors/hojai-core';

export interface IVRMenu {
  id: string;
  name: string;
  prompt: string;
  options: IVROption[];
}

export interface IVROption {
  key: string;
  label: string;
  action: 'transfer' | 'record' | 'menu' | 'callback' | 'appointment' | 'information';
  destination?: string;
  data?: Record<string, any>;
}

export interface CallSession {
  id: string;
  callerId: string;
  callerName?: string;
  startTime: Date;
  currentMenu: string;
  menuHistory: string[];
  recordedInfo: Record<string, any>;
  transferredTo?: string;
  notes: string;
  outcome: 'completed' | 'transferred' | 'voicemail' | 'abandoned';
}

export interface CallRecording {
  id: string;
  sessionId: string;
  type: 'voicemail' | 'message' | 'callback-request';
  audioUrl?: string;
  transcript?: string;
  createdAt: Date;
}

class PhoneReceptionistAgent {
  private agentName = 'Phone Receptionist';
  private agentId = 'phone-receptionist-001';
  private port: number;
  private app: express.Application;
  private activeSessions: Map<string, CallSession> = new Map();
  private recordings: Map<string, CallRecording> = new Map();

  // IVR Menu Structure
  private mainMenu: IVRMenu = {
    id: 'main',
    name: 'Main Menu',
    prompt: 'Thank you for calling HOJAI AI. For sales inquiries, press one. For customer support, press two. For general information, press three. For appointments, press four. To speak with an operator, press zero.',
    options: [
      { key: '1', label: 'Sales', action: 'menu', destination: 'sales' },
      { key: '2', label: 'Support', action: 'menu', destination: 'support' },
      { key: '3', label: 'Information', action: 'menu', destination: 'information' },
      { key: '4', label: 'Appointments', action: 'menu', destination: 'appointments' },
      { key: '0', label: 'Operator', action: 'transfer', destination: 'operator-queue' }
    ]
  };

  private salesMenu: IVRMenu = {
    id: 'sales',
    name: 'Sales Menu',
    prompt: 'Our sales team can help you with Waitron for restaurants, ShopFlow for retail, StayBot for hotels, GlamAI for salons, and more. Press one to hear about our products. Press two to speak with a sales representative. Press three to request a callback. Press nine to return to the main menu.',
    options: [
      { key: '1', label: 'Product List', action: 'information', data: { type: 'products' } },
      { key: '2', label: 'Sales Rep', action: 'transfer', destination: 'sales-queue' },
      { key: '3', label: 'Callback', action: 'callback' },
      { key: '9', label: 'Main Menu', action: 'menu', destination: 'main' }
    ]
  };

  private supportMenu: IVRMenu = {
    id: 'support',
    name: 'Support Menu',
    prompt: 'For technical support, press one. For billing inquiries, press two. For account changes, press three. Press nine to return to the main menu.',
    options: [
      { key: '1', label: 'Technical', action: 'transfer', destination: 'tech-support-queue' },
      { key: '2', label: 'Billing', action: 'transfer', destination: 'billing-queue' },
      { key: '3', label: 'Account', action: 'transfer', destination: 'account-queue' },
      { key: '9', label: 'Main Menu', action: 'menu', destination: 'main' }
    ]
  };

  private informationMenu: IVRMenu = {
    id: 'information',
    name: 'Information Menu',
    prompt: 'Press one for business hours. Press two for our address. Press three for upcoming events. Press nine to return to the main menu.',
    options: [
      { key: '1', label: 'Hours', action: 'information', data: { type: 'hours' } },
      { key: '2', label: 'Address', action: 'information', data: { type: 'address' } },
      { key: '3', label: 'Events', action: 'information', data: { type: 'events' } },
      { key: '9', label: 'Main Menu', action: 'menu', destination: 'main' }
    ]
  };

  private appointmentsMenu: IVRMenu = {
    id: 'appointments',
    name: 'Appointments Menu',
    prompt: 'To schedule an appointment, press one. To reschedule, press two. To cancel, press three. Press nine to return to the main menu.',
    options: [
      { key: '1', label: 'Schedule', action: 'appointment' },
      { key: '2', label: 'Reschedule', action: 'appointment' },
      { key: '3', label: 'Cancel', action: 'appointment' },
      { key: '9', label: 'Main Menu', action: 'menu', destination: 'main' }
    ]
  };

  private menus: Map<string, IVRMenu> = new Map([
    ['main', this.mainMenu],
    ['sales', this.salesMenu],
    ['support', this.supportMenu],
    ['information', this.informationMenu],
    ['appointments', this.appointmentsMenu]
  ]);

  constructor(port: number = 4981) {
    this.port = port;
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        agent: this.agentName,
        agentId: this.agentId,
        activeSessions: this.activeSessions.size
      });
    });

    // Start new call session
    this.app.post('/call/start', async (req: Request, res: Response) => {
      try {
        const { callerId, callerName } = req.body;

        const session: CallSession = {
          id: uuidv4(),
          callerId,
          callerName,
          startTime: new Date(),
          currentMenu: 'main',
          menuHistory: ['main'],
          recordedInfo: {},
          notes: '',
          outcome: 'completed'
        };

        this.activeSessions.set(session.id, session);

        // Look up caller in customer database
        if (callerId) {
          const customer = await customer360Service.getCustomerByPhone(callerId);
          if (customer) {
            session.callerName = customer.name;
            session.recordedInfo['customerId'] = customer.id;
          }
        }

        const menu = this.menus.get('main');
        res.json({
          sessionId: session.id,
          prompt: menu?.prompt,
          options: menu?.options
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to start call' });
      }
    });

    // Handle DTMF input
    this.app.post('/call/input', async (req: Request, res: Response) => {
      try {
        const { sessionId, key } = req.body;
        const session = this.activeSessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        const currentMenu = this.menus.get(session.currentMenu);
        if (!currentMenu) {
          return res.status(500).json({ error: 'Menu not found' });
        }

        const selectedOption = currentMenu.options.find(o => o.key === key);

        if (!selectedOption) {
          return res.json({
            prompt: 'Invalid option. Please try again.',
            options: currentMenu.options
          });
        }

        // Record the choice
        session.menuHistory.push(`${session.currentMenu}:${key}`);

        // Handle different actions
        switch (selectedOption.action) {
          case 'menu':
            return this.handleMenuNavigation(session, selectedOption.destination || 'main', res);
          case 'transfer':
            return this.handleTransfer(session, selectedOption.destination || 'operator', res);
          case 'callback':
            return this.handleCallbackRequest(session, res);
          case 'information':
            return this.handleInformationRequest(session, selectedOption.data, res);
          case 'appointment':
            return this.handleAppointmentRequest(session, selectedOption.label, res);
          default:
            return res.json({
              prompt: 'Processing your request...',
              options: []
            });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to process input' });
      }
    });

    // Record voicemail
    this.app.post('/call/voicemail', async (req: Request, res: Response) => {
      try {
        const { sessionId, audioUrl, transcript } = req.body;
        const session = this.activeSessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        const recording: CallRecording = {
          id: uuidv4(),
          sessionId,
          type: 'voicemail',
          audioUrl,
          transcript,
          createdAt: new Date()
        };

        this.recordings.set(recording.id, recording);

        // Create lead from voicemail if applicable
        if (transcript) {
          await this.processVoicemailLead(session, transcript);
        }

        session.outcome = 'voicemail';
        res.json({ success: true, recordingId: recording.id });
      } catch (error) {
        res.status(500).json({ error: 'Failed to record voicemail' });
      }
    });

    // End call
    this.app.post('/call/end', (req: Request, res: Response) => {
      const { sessionId, notes } = req.body;
      const session = this.activeSessions.get(sessionId);

      if (session) {
        if (notes) session.notes = notes;
        session.outcome = 'completed';
      }

      res.json({ success: true });
    });

    // Get session
    this.app.get('/call/:sessionId', (req: Request, res: Response) => {
      const session = this.activeSessions.get(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    });

    // Get active sessions
    this.app.get('/calls/active', (req: Request, res: Response) => {
      res.json(Array.from(this.activeSessions.values()));
    });

    // Get recordings
    this.app.get('/recordings', (req: Request, res: Response) => {
      res.json(Array.from(this.recordings.values()));
    });
  }

  /**
   * Handle menu navigation
   */
  private async handleMenuNavigation(
    session: CallSession,
    menuId: string,
    res: Response
  ): Promise<void> {
    const menu = this.menus.get(menuId);

    if (!menu) {
      res.status(500).json({ error: 'Menu not found' });
      return;
    }

    session.currentMenu = menuId;
    session.menuHistory.push(menuId);

    res.json({
      prompt: menu.prompt,
      options: menu.options
    });
  }

  /**
   * Handle transfer to queue/agent
   */
  private async handleTransfer(
    session: CallSession,
    destination: string,
    res: Response
  ): Promise<void> {
    session.transferredTo = destination;

    // Log the transfer
    console.log(`[${this.agentName}] Transferring session ${session.id} to ${destination}`);

    // Create lead for callback if not existing customer
    if (!session.recordedInfo['customerId'] && session.callerId) {
      await unifiedLeadService.addLead({
        name: session.callerName || 'Unknown Caller',
        email: '',
        phone: session.callerId,
        source: 'phone' as IndustryType,
        score: 50,
        status: 'new',
        industry: 'waitron' as IndustryType,
        crossIndustries: [],
        notes: `Transferred to ${destination}`,
        conversionProbability: 0.3,
        tags: ['phone-lead', destination]
      });
    }

    res.json({
      prompt: 'Please hold while we transfer you.',
      transferred: true,
      destination
    });
  }

  /**
   * Handle callback request
   */
  private async handleCallbackRequest(
    session: CallSession,
    res: Response
  ): Promise<void> {
    session.recordedInfo['callbackRequested'] = true;

    // Create callback lead
    await unifiedLeadService.addLead({
      name: session.callerName || 'Unknown Caller',
      email: '',
      phone: session.callerId,
      source: 'phone' as IndustryType,
      score: 60,
      status: 'new',
      industry: 'waitron' as IndustryType,
      crossIndustries: [],
      notes: 'Callback requested via IVR',
      conversionProbability: 0.5,
      tags: ['callback-request']
    });

    res.json({
      prompt: 'Thank you. A representative will call you back within 24 hours. Goodbye.',
      completed: true
    });
  }

  /**
   * Handle information request
   */
  private async handleInformationRequest(
    session: CallSession,
    data: any,
    res: Response
  ): Promise<void> {
    if (!data || !data.type) {
      res.json({ prompt: 'Information not available.', options: [] });
      return;
    }

    let information = '';

    switch (data.type) {
      case 'products':
        const products = hojaiCore.getAllProducts();
        information = 'Our products include: ';
        information += products.slice(0, 5).map(p => p.name).join(', ');
        information += '. Press two to speak with a sales representative.';
        break;
      case 'hours':
        information = 'Our business hours are Monday to Friday, 9 AM to 6 PM. Press nine to return to the main menu.';
        break;
      case 'address':
        information = 'Our headquarters is located at 123 AI Street, Innovation City. Press nine to return to the main menu.';
        break;
      case 'events':
        information = 'We are hosting a product demo webinar next Tuesday at 2 PM. Press two to register. Press nine to return.';
        break;
      default:
        information = 'Information not available. Press nine to return to the main menu.';
    }

    res.json({
      prompt: information,
      options: [{ key: '9', label: 'Main Menu', action: 'menu', destination: 'main' }]
    });
  }

  /**
   * Handle appointment request
   */
  private async handleAppointmentRequest(
    session: CallSession,
    action: string,
    res: Response
  ): Promise<void> {
    session.recordedInfo['appointmentAction'] = action;

    let prompt = '';
    switch (action) {
      case 'Schedule':
        prompt = 'To schedule an appointment, please visit our website at hojai.ai/appointments or press two to request a callback. Press nine to return.';
        break;
      case 'Reschedule':
        prompt = 'To reschedule, please call our main line during business hours. Press nine to return.';
        break;
      case 'Cancel':
        prompt = 'To cancel, please provide your booking reference. Press nine to return.';
        break;
    }

    res.json({
      prompt,
      options: [{ key: '9', label: 'Main Menu', action: 'menu', destination: 'main' }]
    });
  }

  /**
   * Process voicemail for lead generation
   */
  private async processVoicemailLead(session: CallSession, transcript: string): Promise<void> {
    // Extract potential info from transcript
    const phoneMatch = transcript.match(/\d{10,}/);
    const emailMatch = transcript.match(/[\w.-]+@[\w.-]+\.\w+/);

    await unifiedLeadService.addLead({
      name: session.callerName || 'Voicemail Caller',
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : session.callerId,
      source: 'phone' as IndustryType,
      score: 40,
      status: 'new',
      industry: 'waitron' as IndustryType,
      crossIndustries: [],
      notes: `Voicemail: ${transcript.substring(0, 200)}`,
      conversionProbability: 0.2,
      tags: ['voicemail', 'phone']
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`[${this.agentName}] IVR Server running on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Get agent status
   */
  getStatus(): {
    agentId: string;
    name: string;
    ready: boolean;
    activeSessions: number;
    totalRecordings: number;
  } {
    return {
      agentId: this.agentId,
      name: this.agentName,
      ready: true,
      activeSessions: this.activeSessions.size,
      totalRecordings: this.recordings.size
    };
  }
}

export const phoneReceptionist = new PhoneReceptionistAgent(4981);

// Start server if run directly
if (require.main === module) {
  phoneReceptionist.start().then(() => {
    console.log('Phone Receptionist Agent started on port 4981');
  });
}