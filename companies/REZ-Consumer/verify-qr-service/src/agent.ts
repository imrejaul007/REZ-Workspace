/**
 * REZ Agent Integration for Verify QR
 * AI Agent for customer communication
 */

import axios from 'axios';

const AGENT_API = process.env.AGENT_API || 'https://REZ-agent.onrender.com';

// ============================================
// CUSTOMER SUPPORT AGENT
// ============================================

interface SupportRequest {
  user_id: string;
  serial_number?: string;
  warranty_id?: string;
  claim_id?: string;
  issue: string;
  channel: 'whatsapp' | 'sms' | 'app_notification';
}

interface SupportResponse {
  ticket_id: string;
  agent_id: string;
  status: 'handled' | 'escalated' | 'pending';
  response: string;
}

// Create support ticket via agent
async function createSupportTicket(req: SupportRequest): Promise<SupportResponse> {
  try {
    const response = await axios.post(`${AGENT_API}/api/agent/support/create`, {
      user_id: req.user_id,
      context: {
        serial_number: req.serial_number,
        warranty_id: req.warranty_id,
        claim_id: req.claim_id,
        issue: req.issue
      },
      channel: req.channel,
      agent_type: 'support',
      priority: req.claim_id ? 'high' : 'medium'
    });
    return response.data;
  } catch (e) {
    return { ticket_id: '', agent_id: '', status: 'pending', response: 'Creating ticket...' };
  }
}

// ============================================
// WHATSAPP AGENT (Customer Communication)
// ============================================

interface WhatsAppMessage {
  user_id: string;
  phone: string;
  template: string;
  params: Record<string, string>;
}

// Send WhatsApp via Agent
async function sendWhatsApp(msg: WhatsAppMessage): Promise<{ success: boolean; message_id: string }> {
  try {
    const response = await axios.post(`${AGENT_API}/api/agent/whatsapp/send`, {
      phone: msg.phone,
      template: msg.template,
      params: msg.params,
      user_id: msg.user_id
    });
    return response.data;
  } catch (e) {
    return { success: false, message_id: '' };
  }
}

// Templates
const WHATSAPP_TEMPLATES = {
  warranty_activated: {
    name: 'warranty_activated',
    message: '✅ Your warranty is now active!\n\n📦 Product: {brand} {model}\n🔢 Serial: {serial}\n📅 Expires: {expiry}\n\nReply "CLAIM" to file a claim.'
  },
  claim_updates: {
    name: 'claim_updates',
    message: '📋 Claim Update\n\nStatus: {status}\nClaim ID: {claim_id}\n\n{update_message}\n\nReply for help.'
  },
  fraud_alert: {
    name: 'fraud_alert',
    message: '⚠️ Security Alert\n\nWe detected unusual activity on your product warranty.\n\n🔢 Serial: {serial}\n\nPlease verify: {verification_link}'
  },
  warranty_expiring: {
    name: 'warranty_expiring',
    message: '⏰ Warranty Expiring Soon\n\n📦 {brand} {model}\n🔢 Serial: {serial}\n📅 Expires: {expiry}\n\nExtend warranty: {link}'
  },
  claim_resolved: {
    name: 'claim_resolved',
    message: '✅ Claim Resolved!\n\n🔢 Serial: {serial}\nResolution: {resolution}\n\nThank you for choosing {brand}!'
  }
};

// ============================================
// PROACTIVE AGENT MESSAGES
// ============================================

interface ProactiveMessage {
  user_id: string;
  trigger: 'warranty_expiring' | 'claim_update' | 'fraud_prevention' | 'upsell';
  data: Record<string, unknown>;
}

// Send proactive message
async function sendProactiveMessage(msg: ProactiveMessage): Promise<void> {
  const templates: Record<string, unknown> = {
    warranty_expiring: {
      template: 'warranty_expiring',
      params: { brand: msg.data.brand, serial: msg.data.serial, expiry: msg.data.expiry, link: msg.data.link }
    },
    claim_update: {
      template: 'claim_updates',
      params: { status: msg.data.status, claim_id: msg.data.claim_id, update_message: msg.data.update }
    },
    fraud_prevention: {
      template: 'fraud_alert',
      params: { serial: msg.data.serial, verification_link: msg.data.link }
    },
    upsell: {
      template: 'warranty_extended',
      params: { brand: msg.data.brand, offer: msg.data.offer }
    }
  };

  try {
    await axios.post(`${AGENT_API}/api/agent/proactive/send`, {
      user_id: msg.user_id,
      trigger: msg.trigger,
      ...templates[msg.trigger]
    });
  } catch (e) {
    logger.error('Failed to send proactive message');
  }
}

// ============================================
// AI SUPPORT COPILOT (In-App Chat)
// ============================================

interface CopilotRequest {
  user_id: string;
  message: string;
  context: {
    serial_number?: string;
    warranty_id?: string;
    claim_id?: string;
  };
}

interface CopilotResponse {
  response: string;
  actions?: { type: string; params: unknown }[];
  escalate: boolean;
}

// Chat with Support Copilot
async function chatWithCopilot(req: CopilotRequest): Promise<CopilotResponse> {
  try {
    const response = await axios.post(`${AGENT_API}/api/agent/copilot/chat`, {
      user_id: req.user_id,
      message: req.message,
      context: {
        ...req.context,
        domain: 'verify-qr',
        capabilities: ['verify', 'warranty', 'claim', 'support']
      }
    });
    return response.data;
  } catch (e) {
    return { response: 'Connecting to support...', escalate: true };
  }
}

// ============================================
// AUTOMATED WORKFLOWS
// ============================================

interface WorkflowTrigger {
  type: 'warranty_activated' | 'claim_filed' | 'claim_resolved' | 'fraud_detected';
  user_id: string;
  data;
}

// Trigger automated workflow
async function triggerWorkflow(trigger: WorkflowTrigger): Promise<void> {
  const workflows: Record<string, unknown> = {
    warranty_activated: {
      workflow: 'warranty_activated_followup',
      steps: [
        { action: 'send_whatsapp', template: 'warranty_activated', delay: '0h' },
        { action: 'send_email', template: 'warranty_confirmation', delay: '1h' },
        { action: 'offer_extended_warranty', delay: '7d' }
      ]
    },
    claim_filed: {
      workflow: 'claim_filed_nps',
      steps: [
        { action: 'send_whatsapp', template: 'claim_received', delay: '0h' },
        { action: 'assign_service_center', delay: '1h' },
        { action: 'send_survey', delay: '48h' }
      ]
    },
    fraud_detected: {
      workflow: 'fraud_investigation',
      steps: [
        { action: 'alert_merchant', delay: '0h' },
        { action: 'send_fraud_alert', delay: '0h' },
        { action: 'freeze_warranty', delay: '1h' }
      ]
    }
  };

  try {
    await axios.post(`${AGENT_API}/api/agent/workflow/trigger`, {
      trigger: trigger.type,
      user_id: trigger.user_id,
      data: trigger.data,
      workflow: workflows[trigger.type]
    });
  } catch (e) {
    logger.error('Failed to trigger workflow');
  }
}

// ============================================
// VOICE AGENT (IVR)
// ============================================

interface VoiceRequest {
  phone: string;
  action: 'verify_warranty' | 'check_claim' | 'report_issue';
  data;
}

// Initiate voice call
async function initiateVoiceCall(req: VoiceRequest): Promise<{ call_id: string }> {
  try {
    const response = await axios.post(`${AGENT_API}/api/agent/voice/initiate`, {
      phone: req.phone,
      action: req.action,
      data: req.data,
      agent: 'verify-qr-voice'
    });
    return response.data;
  } catch (e) {
    return { call_id: '' };
  }
}

// ============================================
// EXPORT
// ============================================

export {
  createSupportTicket,
  sendWhatsApp,
  sendProactiveMessage,
  chatWithCopilot,
  triggerWorkflow,
  initiateVoiceCall,
  WHATSAPP_TEMPLATES
};
