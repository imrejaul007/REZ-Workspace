/**
 * REZ Forms SDK - JavaScript/TypeScript Client
 *
 * @example
 * ```typescript
 * import { createClient } from '@rez/forms-sdk';
 *
 * const client = createClient({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'https://api.rez.money'
 * });
 *
 * // Create form
 * const form = await client.forms.create({
 *   title: 'Contact Form',
 *   fields: [...]
 * });
 *
 * // Submit form
 * const submission = await client.submissions.submit(form.id, {
 *   answers: [...]
 * });
 * ```
 */

export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface Form {
  id: string;
  slug: string;
  title: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
  branding: FormBranding;
  published: boolean;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  question: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
}

export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'time'
  | 'url'
  | 'file_upload'
  | 'multiple_choice'
  | 'dropdown'
  | 'checkbox'
  | 'yes_no'
  | 'rating'
  | 'scale'
  | 'signature'
  | 'payment'
  | 'calculation';

export interface FormSettings {
  allowAnonymous: boolean;
  oneSubmissionPerUser: boolean;
  showProgressBar: boolean;
  showQuestionNumbers: boolean;
  notifyOnSubmission: boolean;
  confirmationMessage: string;
  requireCorpID: boolean;
}

export interface FormBranding {
  primaryColor: string;
  backgroundColor: string;
  fontFamily?: string;
  hidePoweredBy: boolean;
}

export interface Submission {
  id: string;
  formId: string;
  userId?: string;
  answers: Answer[];
  submittedAt: string;
  completionTime?: number;
}

export interface Answer {
  fieldId: string;
  value: string | string[] | number | boolean | null;
  type: FieldType;
}

export interface Workflow {
  id: string;
  name: string;
  enabled: boolean;
  type: 'on_submission' | 'on_condition' | 'on_schedule' | 'on_payment';
  config: WorkflowConfig;
}

export interface WorkflowConfig {
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
}

export interface WorkflowCondition {
  fieldId: string;
  operator: string;
  value: any;
}

export interface WorkflowAction {
  type: 'create_lead' | 'add_to_list' | 'send_email' | 'send_sms' | 'send_webhook' | 'trigger_genie' | 'create_safe_qr' | 'add_to_crm';
  config: Record<string, any>;
}

export interface AIGeneratedForm {
  blocks: any[];
  fields: FormField[];
  suggestedSettings: Partial<FormSettings>;
  suggestedWorkflows: Partial<Workflow>[];
}

export interface Analytics {
  totalSubmissions: number;
  completionRate: number;
  averageCompletionTime: number;
  submissionsByDate: Record<string, number>;
  byDevice: Record<string, number>;
}

// API Client
class REZFormsClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: ClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.rez.money/forms';
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Forms API
  readonly forms = {
    /**
     * List all forms
     */
    list: (options?: { page?: number; pageSize?: number; published?: boolean }) =>
      this.request<{ forms: Form[]; total: number; page: number }>('/api/forms', {
        method: 'GET',
        headers: { 'X-User-ID': 'current' }, // TODO: Get from auth
      }),

    /**
     * Get form by ID
     */
    get: (formId: string) =>
      this.request<Form>(`/api/forms/${formId}`),

    /**
     * Get form by slug
     */
    getBySlug: (slug: string) =>
      this.request<Form>(`/api/forms/slug/${slug}`),

    /**
     * Create new form
     */
    create: (data: { title: string; description?: string; fields?: FormField[] }) =>
      this.request<Form>('/api/forms', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * Update form
     */
    update: (formId: string, data: Partial<Form>) =>
      this.request<Form>(`/api/forms/${formId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    /**
     * Delete form
     */
    delete: (formId: string) =>
      this.request<void>(`/api/forms/${formId}`, { method: 'DELETE' }),

    /**
     * Publish form
     */
    publish: (formId: string) =>
      this.request<Form>(`/api/forms/${formId}/publish`, { method: 'POST' }),

    /**
     * Unpublish form
     */
    unpublish: (formId: string) =>
      this.request<Form>(`/api/forms/${formId}/unpublish`, { method: 'POST' }),

    /**
     * Clone form
     */
    clone: (formId: string) =>
      this.request<Form>(`/api/forms/${formId}/clone`, { method: 'POST' }),

    /**
     * Add field to form
     */
    addField: (formId: string, field: Omit<FormField, 'id'>) =>
      this.request<FormField>(`/api/forms/${formId}/fields`, {
        method: 'POST',
        body: JSON.stringify(field),
      }),

    /**
     * Get share URL
     */
    getShareUrl: (formId: string) =>
      this.request<{ url: string; embedCode: string; qrCode?: string }>(`/api/forms/${formId}/share`),

    /**
     * Get analytics
     */
    getAnalytics: (formId: string) =>
      this.request<Analytics>(`/api/forms/${formId}/analytics`),
  };

  // Submissions API
  readonly submissions = {
    /**
     * Submit form
     */
    submit: (formId: string, data: { answers: Answer[]; userId?: string }) =>
      this.request<Submission>(`/api/submissions/${formId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * Get submission
     */
    get: (submissionId: string) =>
      this.request<Submission>(`/api/submissions/${submissionId}`),

    /**
     * List form submissions
     */
    list: (formId: string, options?: { page?: number; pageSize?: number }) =>
      this.request<{ submissions: Submission[]; total: number }>(`/api/submissions/form/${formId}`, {
        method: 'GET',
        ...options,
      }),

    /**
     * Export submissions to CSV
     */
    exportCSV: async (formId: string): Promise<string> => {
      const response = await fetch(`${this.baseUrl}/api/submissions/form/${formId}/export`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.text();
    },

    /**
     * Get submission analytics
     */
    getAnalytics: (formId: string) =>
      this.request<Analytics>(`/api/submissions/form/${formId}/analytics`),
  };

  // AI API
  readonly ai = {
    /**
     * Generate form structure from prompt
     */
    generate: (prompt: string) =>
      this.request<AIGeneratedForm>('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      }),

    /**
     * Generate and save form
     */
    generateAndSave: (data: { prompt: string; title?: string }) =>
      this.request<{ form: Form; formType: string }>('/api/ai/generate/save', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * Enhance fields with suggestions
     */
    enhance: (fields: FormField[]) =>
      this.request<{ enhancedFields: FormField[]; addedFields: FormField[] }>('/api/ai/enhance', {
        method: 'POST',
        body: JSON.stringify({ fields }),
      }),

    /**
     * Detect form type
     */
    detectType: (prompt: string) =>
      this.request<{ formType: string; suggestion: any }>('/api/ai/detect-type', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      }),

    /**
     * Analyze form quality
     */
    analyze: (form: { title?: string; fields: FormField[] }) =>
      this.request<{ score: number; issues: string[]; suggestions: string[] }>('/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify(form),
      }),
  };

  // Workflows API
  readonly workflows = {
    /**
     * Create workflow
     */
    create: (data: { formId: string; name: string; type: string; config: WorkflowConfig }) =>
      this.request<Workflow>('/api/workflows', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * Get workflow templates
     */
    getTemplates: () =>
      this.request<{ templates: any[] }>('/api/workflows/templates'),

    /**
     * Get integrations
     */
    getIntegrations: () =>
      this.request<{ integrations: any[] }>('/api/workflows/integrations'),

    /**
     * Test workflow
     */
    test: (data: { actionType: string; config: Record<string, any>; testData?: Record<string, any> }) =>
      this.request<{ success: boolean; result: string }>('/api/workflows/test', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Webhooks API
  readonly webhooks = {
    /**
     * Create webhook
     */
    create: (data: { formId: string; url: string; events: string[]; secret?: string }) =>
      this.request<{ id: string; url: string; secret: string }>('/api/webhooks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    /**
     * List webhooks
     */
    list: (formId?: string) =>
      this.request<{ webhooks: any[] }>(`/api/webhooks${formId ? `?formId=${formId}` : ''}`),

    /**
     * Test webhook
     */
    test: (webhookId: string) =>
      this.request<{ success: boolean; statusCode: number }>(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
      }),

    /**
     * Delete webhook
     */
    delete: (webhookId: string) =>
      this.request<void>(`/api/webhooks/${webhookId}`, { method: 'DELETE' }),
  };
}

/**
 * Create REZ Forms client
 */
export function createClient(config: ClientConfig): REZFormsClient {
  return new REZFormsClient(config);
}

// React hooks
export { useForm, useSubmission, useFormAnalytics } from './hooks';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sdk',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
