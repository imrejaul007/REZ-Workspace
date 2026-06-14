/**
 * WhatsApp Business Message Templates
 *
 * Pre-approved message templates for the ReZ Merchant B2B platform.
 * All templates must be registered and approved with WhatsApp before use.
 *
 * Template categories:
 * - PO (Purchase Order): Created, Approved, Rejected
 * - Payment: Reminder, Overdue, Received
 * - RFQ (Request for Quote): Invitation, Quote Received
 * - Statement: Account statements
 * - Custom: Free-form messages
 *
 * Template naming convention: lowercase_with_underscores
 * Parameter format: {{1}}, {{2}}, etc. for positional parameters
 */

export enum WhatsAppTemplate {
  // Purchase Order Templates
  PO_CREATED = 'po_created',
  PO_APPROVED = 'po_approved',
  PO_REJECTED = 'po_rejected',

  // Payment Templates
  PAYMENT_REMINDER = 'payment_reminder',
  PAYMENT_OVERDUE = 'payment_overdue',
  PAYMENT_RECEIVED = 'payment_received',

  // RFQ Templates
  RFQ_INVITATION = 'rfq_invitation',
  QUOTE_RECEIVED = 'quote_received',

  // Statement Templates
  STATEMENT = 'statement',

  // Custom Templates
  CUSTOM_MESSAGE = 'custom_message',
}

export interface TemplateConfig {
  name: string;
  category: 'po' | 'payment' | 'rfq' | 'statement' | 'custom';
  description: string;
  sample: string;
  parameters: string[];
  businessHoursOnly: boolean;
  urgent: boolean;
}

export interface TemplateMetadata {
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  followUpRequired: boolean;
  legalCompliant: boolean;
}

/**
 * Template configurations with metadata
 * These must be registered with WhatsApp Business API
 */
export const TEMPLATE_CONFIGS: Record<WhatsAppTemplate, TemplateConfig> = {
  [WhatsAppTemplate.PO_CREATED]: {
    name: 'po_created',
    category: 'po',
    description: 'Notify supplier about new purchase order',
    sample: 'New Purchase Order {{1}} created for {{2}}. Amount: Rs.{{3}}. Due: {{4}}',
    parameters: ['PO Number', 'Supplier Name', 'Amount', 'Due Date'],
    businessHoursOnly: true,
    urgent: false,
  },

  [WhatsAppTemplate.PO_APPROVED]: {
    name: 'po_approved',
    category: 'po',
    description: 'Notify supplier that PO is approved',
    sample: 'Purchase Order {{1}} has been approved. Total: Rs.{{2}}',
    parameters: ['PO Number', 'Total Amount'],
    businessHoursOnly: true,
    urgent: false,
  },

  [WhatsAppTemplate.PO_REJECTED]: {
    name: 'po_rejected',
    category: 'po',
    description: 'Notify supplier that PO is rejected',
    sample: 'Purchase Order {{1}} was rejected. Reason: {{2}}',
    parameters: ['PO Number', 'Rejection Reason'],
    businessHoursOnly: true,
    urgent: false,
  },

  [WhatsAppTemplate.PAYMENT_REMINDER]: {
    name: 'payment_reminder',
    category: 'payment',
    description: 'Payment reminder before due date',
    sample: 'Reminder: Payment of Rs.{{1}} for PO {{2}} is due on {{3}}. - {{4}}',
    parameters: ['Amount', 'PO Number', 'Due Date', 'Merchant Name'],
    businessHoursOnly: true,
    urgent: false,
  },

  [WhatsAppTemplate.PAYMENT_OVERDUE]: {
    name: 'payment_overdue',
    category: 'payment',
    description: 'Alert for overdue payment',
    sample: 'Alert: PO {{1}} payment of Rs.{{2}} is {{3}} days overdue. - {{4}}',
    parameters: ['PO Number', 'Amount', 'Days Overdue', 'Merchant Name'],
    businessHoursOnly: false, // Overdue alerts can be sent anytime
    urgent: true,
  },

  [WhatsAppTemplate.PAYMENT_RECEIVED]: {
    name: 'payment_received',
    category: 'payment',
    description: 'Payment confirmation',
    sample: 'Payment of Rs.{{1}} received for PO {{2}}. Thank you!',
    parameters: ['Amount', 'PO Number'],
    businessHoursOnly: false,
    urgent: false,
  },

  [WhatsAppTemplate.RFQ_INVITATION]: {
    name: 'rfq_invitation',
    category: 'rfq',
    description: 'Invitation to submit quote',
    sample: "You've been invited to submit a quote for RFQ {{1}}: {{2}}",
    parameters: ['RFQ Number', 'Description'],
    businessHoursOnly: true,
    urgent: false,
  },

  [WhatsAppTemplate.QUOTE_RECEIVED]: {
    name: 'quote_received',
    category: 'rfq',
    description: 'Notification of received quote',
    sample: 'New quote received for RFQ {{1}}. Amount: Rs.{{2}}',
    parameters: ['RFQ Number', 'Quote Amount'],
    businessHoursOnly: true,
    urgent: false,
  },

  [WhatsAppTemplate.STATEMENT]: {
    name: 'statement',
    category: 'statement',
    description: 'Account statement summary',
    sample: 'Your account statement: Total Outstanding Rs.{{1}}, Due: Rs.{{2}}. Pay now: {{3}}',
    parameters: ['Total Outstanding', 'Due Amount', 'Payment Link'],
    businessHoursOnly: true,
    urgent: false,
  },

  [WhatsAppTemplate.CUSTOM_MESSAGE]: {
    name: 'custom_message',
    category: 'custom',
    description: 'Free-form message template',
    sample: '{{1}}',
    parameters: ['Message Content'],
    businessHoursOnly: true,
    urgent: false,
  },
};

/**
 * Template metadata for compliance and routing
 */
export const TEMPLATE_METADATA: Record<WhatsAppTemplate, TemplateMetadata> = {
  [WhatsAppTemplate.PO_CREATED]: {
    category: 'transactional',
    urgency: 'medium',
    followUpRequired: true,
    legalCompliant: true,
  },

  [WhatsAppTemplate.PO_APPROVED]: {
    category: 'transactional',
    urgency: 'medium',
    followUpRequired: true,
    legalCompliant: true,
  },

  [WhatsAppTemplate.PO_REJECTED]: {
    category: 'transactional',
    urgency: 'medium',
    followUpRequired: false,
    legalCompliant: true,
  },

  [WhatsAppTemplate.PAYMENT_REMINDER]: {
    category: 'transactional',
    urgency: 'medium',
    followUpRequired: true,
    legalCompliant: true,
  },

  [WhatsAppTemplate.PAYMENT_OVERDUE]: {
    category: 'transactional',
    urgency: 'high',
    followUpRequired: true,
    legalCompliant: true,
  },

  [WhatsAppTemplate.PAYMENT_RECEIVED]: {
    category: 'transactional',
    urgency: 'low',
    followUpRequired: false,
    legalCompliant: true,
  },

  [WhatsAppTemplate.RFQ_INVITATION]: {
    category: 'marketing',
    urgency: 'medium',
    followUpRequired: true,
    legalCompliant: true,
  },

  [WhatsAppTemplate.QUOTE_RECEIVED]: {
    category: 'transactional',
    urgency: 'medium',
    followUpRequired: true,
    legalCompliant: true,
  },

  [WhatsAppTemplate.STATEMENT]: {
    category: 'transactional',
    urgency: 'medium',
    followUpRequired: true,
    legalCompliant: true,
  },

  [WhatsAppTemplate.CUSTOM_MESSAGE]: {
    category: 'marketing',
    urgency: 'low',
    followUpRequired: false,
    legalCompliant: true,
  },
};

/**
 * Get template body text (sample message)
 */
export function getTemplateBody(template: WhatsAppTemplate): string | null {
  const config = TEMPLATE_CONFIGS[template];
  return config ? config.sample : null;
}

/**
 * Get template configuration
 */
export function getTemplateConfig(template: WhatsAppTemplate): TemplateConfig | null {
  return TEMPLATE_CONFIGS[template] || null;
}

/**
 * Get template metadata
 */
export function getTemplateMetadata(template: WhatsAppTemplate): TemplateMetadata | null {
  return TEMPLATE_METADATA[template] || null;
}

/**
 * List all available templates
 */
export function listTemplates(): Array<{
  id: WhatsAppTemplate;
  name: string;
  category: string;
  description: string;
  parameters: string[];
  urgent: boolean;
}> {
  return Object.entries(TEMPLATE_CONFIGS).map(([id, config]) => ({
    id: id as WhatsAppTemplate,
    name: config.name,
    category: config.category,
    description: config.description,
    parameters: config.parameters,
    urgent: config.urgent,
  }));
}

/**
 * Check if template requires business hours
 */
export function requiresBusinessHours(template: WhatsAppTemplate): boolean {
  return TEMPLATE_CONFIGS[template]?.businessHoursOnly ?? true;
}

/**
 * Check if template is urgent
 */
export function isUrgentTemplate(template: WhatsAppTemplate): boolean {
  return TEMPLATE_CONFIGS[template]?.urgent ?? false;
}

/**
 * Format amount for WhatsApp message (Indian Rupees)
 */
export function formatAmount(amount: number): string {
  return `Rs.${amount.toLocaleString('en-IN')}`;
}

/**
 * Format date for WhatsApp message
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Create message parameters from template and data
 */
export function createMessageParams(
  template: WhatsAppTemplate,
  data: Record<string, string | number | Date>
): string[] {
  const config = TEMPLATE_CONFIGS[template];
  if (!config) return [];

  return config.parameters.map((param) => {
    const value = data[param];
    if (value === undefined) return param;

    if (value instanceof Date) {
      return formatDate(value);
    }

    if (param.toLowerCase().includes('amount')) {
      return formatAmount(Number(value));
    }

    return String(value);
  });
}

/**
 * Get reminder message variations based on urgency
 */
export function getReminderMessageVariations(): Record<string, string> {
  return {
    gentle: 'Reminder: Payment of {{amount}} for PO {{poNumber}} is due on {{dueDate}}. - {{merchantName}}',
    strong: 'Important: Payment of {{amount}} for PO {{poNumber}} is due {{daysLeft}} days. Please arrange funds. - {{merchantName}}',
    urgent: 'URGENT: Payment of {{amount}} for PO {{poNumber}} is due TOMORROW! Please confirm receipt. - {{merchantName}}',
    today: 'TODAY: Payment of {{amount}} for PO {{poNumber}} is due today. Please process immediately. - {{merchantName}}',
  };
}

/**
 * Get overdue message variations based on severity
 */
export function getOverdueMessageVariations(): Record<string, string> {
  return {
    first: 'Alert: PO {{poNumber}} payment of {{amount}} is {{daysOverdue}} day(s) overdue. Please arrange payment. - {{merchantName}}',
    escalation: 'Escalation: PO {{poNumber}} payment of {{amount}} is {{daysOverdue}} days overdue. Please contact us. - {{merchantName}}',
    final: 'FINAL NOTICE: PO {{poNumber}} payment of {{amount}} is {{daysOverdue}} days overdue. Legal action may be initiated. - {{merchantName}}',
    legal: 'Legal Notice: Outstanding payment of {{amount}} for PO {{poNumber}} is {{daysOverdue}} days overdue. Contact us immediately to avoid further action. - {{merchantName}}',
  };
}

/**
 * WhatsApp template category enum
 */
export type TemplateCategory = 'po' | 'payment' | 'rfq' | 'statement' | 'custom';

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): TemplateConfig[] {
  return Object.values(TEMPLATE_CONFIGS).filter((config) => config.category === category);
}

/**
 * WhatsApp supported languages
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
] as const;

/**
 * Validate template parameters count
 */
export function validateTemplateParams(
  template: WhatsAppTemplate,
  params: string[]
): { valid: boolean; error?: string } {
  const config = TEMPLATE_CONFIGS[template];
  if (!config) {
    return { valid: false, error: `Unknown template: ${template}` };
  }

  if (template === WhatsAppTemplate.CUSTOM_MESSAGE) {
    return { valid: true }; // Custom message has no parameter limit
  }

  if (params.length !== config.parameters.length) {
    return {
      valid: false,
      error: `Template ${config.name} requires ${config.parameters.length} parameters, but ${params.length} provided`,
    };
  }

  return { valid: true };
}

export default WhatsAppTemplate;
