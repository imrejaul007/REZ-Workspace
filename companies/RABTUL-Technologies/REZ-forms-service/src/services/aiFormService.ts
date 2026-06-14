/**
 * REZ Forms - AI Form Generation Service
 * Generate forms from natural language (Tally killer feature)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  FormField,
  FormBlock,
  FormSettings,
  WorkflowTrigger,
  AIGeneratedForm,
  FieldType
} from '../types';

/**
 * AI Form Generation from Natural Language
 * This is a mock implementation - in production, integrate with HOJAI AI
 */
export async function generateFormFromText(
  prompt: string,
  userId: string
): Promise<AIGeneratedForm> {
  // In production: Call HOJAI AI for form generation
  // For now, use pattern matching

  const lowerPrompt = prompt.toLowerCase();

  // Detect form type and generate appropriate fields
  const fields: FormField[] = [];
  const blocks: FormBlock[] = [];

  // Helper to add field
  const addField = (
    type: FieldType,
    question: string,
    options?: { required?: boolean; options?: string[] }
  ) => {
    const fieldId = uuidv4();
    fields.push({
      id: fieldId,
      type,
      question,
      required: options?.required ?? false,
      options: options?.options,
    });
    blocks.push({
      id: uuidv4(),
      type: 'field',
      fieldId,
    });
    return fieldId;
  };

  // Detect form category and generate fields
  if (lowerPrompt.includes('contact') || lowerPrompt.includes('inquiry')) {
    // Contact form
    addField('short_text', 'What is your name?', { required: true });
    addField('email', 'What is your email address?', { required: true });
    addField('phone', 'What is your phone number?');
    addField('dropdown', 'What are you interested in?', {
      options: ['General Inquiry', 'Partnership', 'Support', 'Sales', 'Other']
    });
    addField('long_text', 'How can we help you?', { required: true });
  } else if (lowerPrompt.includes('feedback') || lowerPrompt.includes('review')) {
    // Feedback form
    addField('short_text', 'What is your name?');
    addField('email', 'What is your email?');
    addField('rating', 'How would you rate your experience?', { required: true });
    addField('multiple_choice', 'What did you like most?', {
      options: ['Quality', 'Service', 'Price', 'Delivery', 'Other']
    });
    addField('long_text', 'Any additional feedback?', { required: false });
  } else if (lowerPrompt.includes('job') || lowerPrompt.includes('apply') || lowerPrompt.includes('career')) {
    // Job application
    addField('short_text', 'Full Name', { required: true });
    addField('email', 'Email Address', { required: true });
    addField('phone', 'Phone Number', { required: true });
    addField('short_text', 'Current Position');
    addField('short_text', 'Years of Experience', { required: true });
    addField('file_upload', 'Upload Resume', { required: true });
    addField('long_text', 'Why do you want to join us?');
    addField('url', 'LinkedIn Profile');
  } else if (lowerPrompt.includes('event') || lowerPrompt.includes('register') || lowerPrompt.includes('rsvp')) {
    // Event registration
    addField('short_text', 'Full Name', { required: true });
    addField('email', 'Email Address', { required: true });
    addField('phone', 'Phone Number');
    addField('dropdown', 'How many attendees?', {
      options: ['1', '2', '3', '4', '5+']
    });
    addField('yes_no', 'Will you need parking?');
    addField('long_text', 'Any dietary requirements or special needs?');
  } else if (lowerPrompt.includes('appointment') || lowerPrompt.includes('booking') || lowerPrompt.includes('schedule')) {
    // Appointment booking
    addField('short_text', 'Your Name', { required: true });
    addField('email', 'Email Address', { required: true });
    addField('phone', 'Phone Number', { required: true });
    addField('date', 'Preferred Date', { required: true });
    addField('time', 'Preferred Time Slot', { required: true });
    addField('dropdown', 'Service Type', {
      options: ['Consultation', 'Follow-up', 'Initial Meeting', 'Other']
    });
    addField('long_text', 'Additional notes or special requests?');
  } else if (lowerPrompt.includes('customer') || lowerPrompt.includes('onboarding') || lowerPrompt.includes('signup')) {
    // Customer onboarding
    addField('short_text', 'Full Name', { required: true });
    addField('email', 'Email Address', { required: true });
    addField('phone', 'Phone Number', { required: true });
    addField('short_text', 'Company Name');
    addField('url', 'Company Website');
    addField('dropdown', 'Company Size', {
      options: ['1-10', '11-50', '51-200', '201-500', '500+']
    });
    addField('long_text', 'What are your main goals?');
  } else if (lowerPrompt.includes('survey') || lowerPrompt.includes('poll')) {
    // Survey
    addField('short_text', 'Your Name (optional)');
    addField('email', 'Email (optional)');
    addField('multiple_choice', 'How often do you use our service?', {
      options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'First time']
    });
    addField('scale', 'How satisfied are you with our service?', { required: true });
    addField('checkbox', 'Which features do you use most?', {
      options: ['Dashboard', 'Reports', 'Analytics', 'Integrations', 'Mobile App']
    });
    addField('long_text', 'What improvements would you like to see?');
  } else if (lowerPrompt.includes('medical') || lowerPrompt.includes('health') || lowerPrompt.includes('patient')) {
    // Healthcare intake
    addField('short_text', 'Full Name', { required: true });
    addField('date', 'Date of Birth', { required: true });
    addField('phone', 'Emergency Contact', { required: true });
    addField('email', 'Email Address');
    addField('yes_no', 'Do you have any allergies?');
    addField('long_text', 'Please list any current medications');
    addField('long_text', 'Describe your symptoms');
    addField('file_upload', 'Upload any relevant medical documents');
  } else if (lowerPrompt.includes('order') || lowerPrompt.includes('purchase') || lowerPrompt.includes('buy')) {
    // Order form
    addField('short_text', 'Full Name', { required: true });
    addField('email', 'Email Address', { required: true });
    addField('phone', 'Phone Number', { required: true });
    addField('long_text', 'Delivery Address', { required: true });
    addField('dropdown', 'Payment Method', {
      options: ['Credit Card', 'UPI', 'Net Banking', 'Cash on Delivery']
    });
    addField('long_text', 'Special instructions for delivery?');
  } else {
    // Generic form - parse intent
    addField('short_text', 'Your Name', { required: true });
    addField('email', 'Email Address', { required: true });
    addField('long_text', prompt.replace(/\?/g, '').trim() || 'How can we help you?', { required: true });
  }

  // Generate suggested settings based on form type
  const suggestedSettings: Partial<FormSettings> = {
    showProgressBar: true,
    showQuestionNumbers: true,
    allowAnonymous: true,
    notifyOnSubmission: true,
    confirmationMessage: 'Thank you for your submission! We will get back to you soon.',
  };

  // Generate suggested workflows
  const suggestedWorkflows: Partial<WorkflowTrigger>[] = [
    {
      name: 'Auto-create Lead',
      enabled: true,
      type: 'on_submission',
      config: {
        actions: [{ type: 'create_lead', config: {} }],
      },
    },
  ];

  return {
    blocks,
    fields,
    suggestedSettings,
    suggestedWorkflows,
  };
}

/**
 * Enhance form with AI suggestions
 */
export async function suggestEnhancements(
  fields: FormField[]
): Promise<FormField[]> {
  const enhanced: FormField[] = [];

  for (const field of fields) {
    enhanced.push(field);

    // Add relevant follow-up fields based on type
    if (field.type === 'email' && !fields.some(f => f.type === 'phone')) {
      enhanced.push({
        id: uuidv4(),
        type: 'phone',
        question: 'Would you like us to call you? If yes, enter your phone number.',
        required: false,
      });
    }

    if (field.type === 'long_text' && !fields.some(f => f.type === 'email')) {
      enhanced.push({
        id: uuidv4(),
        type: 'email',
        question: 'How can we follow up with you? Enter your email.',
        required: false,
      });
    }
  }

  return enhanced;
}

/**
 * Calculate form fields based on expressions
 */
export function calculateFieldValue(
  expression: string,
  answers: Record<string, any>
): number {
  try {
    // Simple calculation parser
    // In production, use a proper expression parser like mathjs
    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');

    // Replace field references with values
    let formula = sanitized;
    for (const [fieldId, value] of Object.entries(answers)) {
      if (typeof value === 'number') {
        formula = formula.replace(new RegExp(fieldId, 'g'), value.toString());
      }
    }

    // Evaluate (basic - use mathjs in production)
    return Function('"use strict"; return (' + formula + ')')();
  } catch {
    return 0;
  }
}

/**
 * Generate conditional logic suggestions
 */
export async function suggestConditionalLogic(
  fields: FormField[]
): Promise<void> {
  // AI-powered conditional logic suggestions
  // In production, analyze field relationships and suggest show/hide logic
  // Example: If "Do you have allergies?" is "Yes", show "List allergies" field
}

/**
 * Detect form type from content
 */
export function detectFormType(prompt: string): string {
  const lower = prompt.toLowerCase();

  const types = [
    { name: 'contact', keywords: ['contact', 'inquiry', 'reach', 'question'] },
    { name: 'feedback', keywords: ['feedback', 'review', 'rate', 'experience'] },
    { name: 'job', keywords: ['job', 'apply', 'career', 'resume', 'hiring'] },
    { name: 'event', keywords: ['event', 'register', 'rsvp', 'attend'] },
    { name: 'appointment', keywords: ['appointment', 'booking', 'schedule', 'meeting'] },
    { name: 'onboarding', keywords: ['customer', 'onboarding', 'signup', 'sign up'] },
    { name: 'survey', keywords: ['survey', 'poll', 'research'] },
    { name: 'healthcare', keywords: ['medical', 'health', 'patient', 'clinic'] },
    { name: 'order', keywords: ['order', 'purchase', 'buy', 'checkout'] },
  ];

  for (const type of types) {
    if (type.keywords.some(k => lower.includes(k))) {
      return type.name;
    }
  }

  return 'general';
}