/**
 * REZ Forms - Form Routes
 * API endpoints for form management
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  createForm,
  getForm,
  getFormBySlug,
  listForms,
  updateForm,
  addField,
  updateField,
  deleteField,
  reorderFields,
  publishForm,
  unpublishForm,
  enableQR,
  addWorkflow,
  deleteForm,
  cloneForm,
  getFormAnalytics,
} from '../services/formService';

export const formRoutes = Router();

// Validation schemas
const createFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  blocks: z.array(z.any()).optional(),
  fields: z.array(z.any()).optional(),
  settings: z.any().optional(),
  branding: z.any().optional(),
});

const updateFormSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  blocks: z.array(z.any()).optional(),
  fields: z.array(z.any()).optional(),
  settings: z.any().optional(),
  branding: z.any().optional(),
});

const addFieldSchema = z.object({
  type: z.string(),
  question: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  conditions: z.array(z.any()).optional(),
  emoji: z.boolean().optional(),
  randomize: z.boolean().optional(),
  calculationExpression: z.string().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(),
});

/**
 * Create a new form
 * POST /api/forms
 */
formRoutes.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const data = createFormSchema.parse(req.body);

    const form = await createForm({
      userId,
      ...data,
    });

    res.status(201).json(form);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Create form error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * List forms
 * GET /api/forms
 */
formRoutes.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const published = req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined;

    const result = await listForms(userId, { page, pageSize, published });

    res.json(result);
  } catch (error) {
    console.error('List forms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get form by ID
 * GET /api/forms/:id
 */
formRoutes.get('/:id', async (req, res) => {
  try {
    const form = await getForm(req.params.id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get form by slug
 * GET /api/forms/slug/:slug
 */
formRoutes.get('/slug/:slug', async (req, res) => {
  try {
    const form = await getFormBySlug(req.params.slug);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Get form by slug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update form
 * PATCH /api/forms/:id
 */
formRoutes.patch('/:id', async (req, res) => {
  try {
    const data = updateFormSchema.parse(req.body);
    const form = await updateForm(req.params.id, data);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Update form error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Delete form
 * DELETE /api/forms/:id
 */
formRoutes.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteForm(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Clone form
 * POST /api/forms/:id/clone
 */
formRoutes.post('/:id/clone', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const form = await cloneForm(req.params.id, userId);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.status(201).json(form);
  } catch (error) {
    console.error('Clone form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Add field to form
 * POST /api/forms/:id/fields
 */
formRoutes.post('/:id/fields', async (req, res) => {
  try {
    const data = addFieldSchema.parse(req.body);
    const { v4: uuidv4 } = require('uuid');

    const field = {
      id: uuidv4(),
      type: data.type,
      question: data.question,
      description: data.description,
      required: data.required || false,
      placeholder: data.placeholder,
      options: data.options,
      min: data.min,
      max: data.max,
      pattern: data.pattern,
      conditions: data.conditions,
      emoji: data.emoji,
      randomize: data.randomize,
      calculationExpression: data.calculationExpression,
      allowedFileTypes: data.allowedFileTypes,
      maxFileSize: data.maxFileSize,
    };

    const form = await addField(req.params.id, field);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.status(201).json(field);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Add field error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Update field
 * PATCH /api/forms/:id/fields/:fieldId
 */
formRoutes.patch('/:id/fields/:fieldId', async (req, res) => {
  try {
    const form = await updateField(req.params.id, req.params.fieldId, req.body);

    if (!form) {
      return res.status(404).json({ error: 'Form or field not found' });
    }

    const field = form.fields.find(f => f.id === req.params.fieldId);
    res.json(field);
  } catch (error) {
    console.error('Update field error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete field
 * DELETE /api/forms/:id/fields/:fieldId
 */
formRoutes.delete('/:id/fields/:fieldId', async (req, res) => {
  try {
    const form = await deleteField(req.params.id, req.params.fieldId);

    if (!form) {
      return res.status(404).json({ error: 'Form or field not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete field error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Reorder fields
 * POST /api/forms/:id/fields/reorder
 */
formRoutes.post('/:id/fields/reorder', async (req, res) => {
  try {
    const { fieldIds } = req.body;
    const form = await reorderFields(req.params.id, fieldIds);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form.fields);
  } catch (error) {
    console.error('Reorder fields error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Publish form
 * POST /api/forms/:id/publish
 */
formRoutes.post('/:id/publish', async (req, res) => {
  try {
    const form = await publishForm(req.params.id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Publish form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Unpublish form
 * POST /api/forms/:id/unpublish
 */
formRoutes.post('/:id/unpublish', async (req, res) => {
  try {
    const form = await unpublishForm(req.params.id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Unpublish form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Enable QR for form
 * POST /api/forms/:id/qr
 */
formRoutes.post('/:id/qr', async (req, res) => {
  try {
    const form = await enableQR(req.params.id, req.body.qrSettings);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Enable QR error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Add workflow to form
 * POST /api/forms/:id/workflows
 */
formRoutes.post('/:id/workflows', async (req, res) => {
  try {
    const form = await addWorkflow(req.params.id, req.body);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const workflow = form.workflows[form.workflows.length - 1];
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Add workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get form analytics
 * GET /api/forms/:id/analytics
 */
formRoutes.get('/:id/analytics', async (req, res) => {
  try {
    const analytics = await getFormAnalytics(req.params.id);

    if (!analytics) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get form shareable URL
 * GET /api/forms/:id/share
 */
formRoutes.get('/:id/share', async (req, res) => {
  try {
    const form = await getForm(req.params.id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({
      url: `https://forms.rez.money/${form.slug}`,
      embedCode: `<iframe src="https://forms.rez.money/embed/${form.id}" width="100%" height="600" frameborder="0"></iframe>`,
      qrCode: form.qrEnabled ? `https://api.rez.money/qr?data=https://forms.rez.money/${form.slug}` : null,
    });
  } catch (error) {
    console.error('Get share URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});