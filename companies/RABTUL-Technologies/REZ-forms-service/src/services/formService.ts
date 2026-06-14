/**
 * REZ Forms - Form Service
 * Core form management logic
 */

import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import {
  Form,
  FormField,
  FormBlock,
  FormSettings,
  FormBranding,
  QRConfig,
  WorkflowTrigger,
  FormListResponse
} from '../types';

// In-memory storage (replace with Prisma/PostgreSQL in production)
const forms: Map<string, Form> = new Map();
const formSlugs: Map<string, string> = new Map(); // slug -> formId

// Default settings
const defaultSettings: FormSettings = {
  allowAnonymous: true,
  oneSubmissionPerUser: false,
  showProgressBar: true,
  showQuestionNumbers: true,
  notifyOnSubmission: false,
  notificationEmails: [],
  confirmationMessage: 'Thank you for your submission!',
  requireCorpID: false,
  storeResponses: true,
};

const defaultBranding: FormBranding = {
  primaryColor: '#000000',
  backgroundColor: '#ffffff',
  hidePoweredBy: false,
};

/**
 * Create a new form
 */
export async function createForm(data: {
  userId: string;
  title: string;
  description?: string;
  blocks?: FormBlock[];
  fields?: FormField[];
  settings?: Partial<FormSettings>;
  branding?: Partial<FormBranding>;
 aiPrompt?: string;
  aiGenerated?: boolean;
}): Promise<Form> {
  const id = uuidv4();
  const slug = generateSlug(data.title);

  const form: Form = {
    id,
    slug,
    title: data.title,
    description: data.description,
    userId: data.userId,
    blocks: data.blocks || [],
    fields: data.fields || [],
    settings: { ...defaultSettings, ...data.settings },
    branding: { ...defaultBranding, ...data.branding },
    qrEnabled: false,
    workflows: [],
    published: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    submissionCount: 0,
    aiGenerated: data.aiGenerated || false,
    aiPrompt: data.aiPrompt,
  };

  forms.set(id, form);
  formSlugs.set(slug, id);

  return form;
}

/**
 * Get form by ID
 */
export async function getForm(formId: string): Promise<Form | null> {
  return forms.get(formId) || null;
}

/**
 * Get form by slug
 */
export async function getFormBySlug(slug: string): Promise<Form | null> {
  const formId = formSlugs.get(slug);
  if (!formId) return null;
  return forms.get(formId) || null;
}

/**
 * List forms for a user
 */
export async function listForms(
  userId: string,
  options: { page?: number; pageSize?: number; published?: boolean } = {}
): Promise<FormListResponse> {
  const { page = 1, pageSize = 20, published } = options;

  let userForms = Array.from(forms.values()).filter(f => f.userId === userId);

  if (published !== undefined) {
    userForms = userForms.filter(f => f.published === published);
  }

  // Sort by updated date
  userForms.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  // Paginate
  const total = userForms.length;
  const start = (page - 1) * pageSize;
  const paginatedForms = userForms.slice(start, start + pageSize);

  return {
    forms: paginatedForms,
    total,
    page,
    pageSize,
  };
}

/**
 * Update form
 */
export async function updateForm(
  formId: string,
  data: Partial<Form>
): Promise<Form | null> {
  const form = forms.get(formId);
  if (!form) return null;

  const updated: Form = {
    ...form,
    ...data,
    id: form.id, // Prevent ID change
    userId: form.userId, // Prevent owner change
    createdAt: form.createdAt, // Prevent creation date change
    updatedAt: new Date(),
  };

  forms.set(formId, updated);
  return updated;
}

/**
 * Add field to form
 */
export async function addField(
  formId: string,
  field: FormField
): Promise<Form | null> {
  const form = forms.get(formId);
  if (!form) return null;

  // Create block for this field
  const block: FormBlock = {
    id: uuidv4(),
    type: 'field',
    fieldId: field.id,
  };

  form.fields.push(field);
  form.blocks.push(block);
  form.updatedAt = new Date();

  forms.set(formId, form);
  return form;
}

/**
 * Update field in form
 */
export async function updateField(
  formId: string,
  fieldId: string,
  updates: Partial<FormField>
): Promise<Form | null> {
  const form = forms.get(formId);
  if (!form) return null;

  const fieldIndex = form.fields.findIndex(f => f.id === fieldId);
  if (fieldIndex === -1) return null;

  form.fields[fieldIndex] = { ...form.fields[fieldIndex], ...updates };
  form.updatedAt = new Date();

  forms.set(formId, form);
  return form;
}

/**
 * Delete field from form
 */
export async function deleteField(
  formId: string,
  fieldId: string
): Promise<Form | null> {
  const form = forms.get(formId);
  if (!form) return null;

  form.fields = form.fields.filter(f => f.id !== fieldId);
  form.blocks = form.blocks.filter(b => b.fieldId !== fieldId);
  form.updatedAt = new Date();

  forms.set(formId, form);
  return form;
}

/**
 * Reorder fields in form
 */
export async function reorderFields(
  formId: string,
  fieldIds: string[]
): Promise<Form | null> {
  const form = forms.get(formId);
  if (!form) return null;

  // Reorder fields
  const reorderedFields: FormField[] = [];
  for (const id of fieldIds) {
    const field = form.fields.find(f => f.id === id);
    if (field) reorderedFields.push(field);
  }

  // Add any missing fields
  for (const field of form.fields) {
    if (!fieldIds.includes(field.id)) {
      reorderedFields.push(field);
    }
  }

  form.fields = reorderedFields;
  form.updatedAt = new Date();

  forms.set(formId, form);
  return form;
}

/**
 * Publish form
 */
export async function publishForm(formId: string): Promise<Form | null> {
  const form = forms.get(formId);
  if (!form) return null;

  form.published = true;
  form.updatedAt = new Date();

  forms.set(formId, form);
  return form;
}

/**
 * Unpublish form
 */
export async function unpublishForm(formId: string): Promise<Form | null> {
  const form = forms.get(formId);
  if (!form) return null;

  form.published = false;
  form.updatedAt = new Date();

  forms.set(formId, form);
  return form;
}

/**
 * Enable QR for form
 */
export async function enableQR(
  formId: string,
  qrSettings?: Partial<QRConfig>
): Promise<Form | null> {
  const form = forms.get(formId);
  if (!form) return null;

  form.qrEnabled = true;
  form.qrSettings = {
    size: qrSettings?.size || 300,
    color: qrSettings?.color || '#000000',
    logo: qrSettings?.logo,
    offlineMode: qrSettings?.offlineMode || false,
  };
  form.updatedAt = new Date();

  forms.set(formId, form);
  return form;
}

/**
 * Add workflow to form
 */
export async function addWorkflow(
  formId: string,
  workflow: WorkflowTrigger
): Promise<Form | null> {
  const form = forms.get(formId);
  if (!form) return null;

  form.workflows.push(workflow);
  form.updatedAt = new Date();

  forms.set(formId, form);
  return form;
}

/**
 * Delete form
 */
export async function deleteForm(formId: string): Promise<boolean> {
  const form = forms.get(formId);
  if (!form) return false;

  formSlugs.delete(form.slug);
  forms.delete(formId);
  return true;
}

/**
 * Increment submission count
 */
export async function incrementSubmissionCount(formId: string): Promise<void> {
  const form = forms.get(formId);
  if (form) {
    form.submissionCount++;
    forms.set(formId, form);
  }
}

/**
 * Generate unique slug
 */
function generateSlug(title: string): string {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  let slug = baseSlug;
  let counter = 1;

  while (formSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Clone form
 */
export async function cloneForm(
  formId: string,
  userId: string
): Promise<Form | null> {
  const original = forms.get(formId);
  if (!original) return null;

  return createForm({
    userId,
    title: `${original.title} (Copy)`,
    description: original.description,
    blocks: original.blocks.map(b => ({ ...b, id: uuidv4() })),
    fields: original.fields.map(f => ({ ...f, id: uuidv4() })),
    settings: original.settings,
    branding: original.branding,
  });
}

/**
 * Get form analytics
 */
export async function getFormAnalytics(formId: string): Promise<{
  totalSubmissions: number;
  completionRate: number;
  averageCompletionTime: number;
  submissionsByDate: Record<string, number>;
} | null> {
  const form = forms.get(formId);
  if (!form) return null;

  return {
    totalSubmissions: form.submissionCount,
    completionRate: 0.85, // Placeholder - calculate from actual data
    averageCompletionTime: 120, // Placeholder - seconds
    submissionsByDate: {}, // Placeholder - aggregate from submissions
  };
}