/**
 * REZ Forms - AI Routes
 * AI-powered form generation endpoints
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  generateFormFromText,
  suggestEnhancements,
  suggestConditionalLogic,
  detectFormType,
} from '../services/aiFormService';
import { createForm } from '../services/formService';

export const aiRoutes = Router();

// Validation schema
const generateFormSchema = z.object({
  prompt: z.string().min(10).max(1000),
  userId: z.string().optional(),
});

/**
 * Generate form from natural language
 * POST /api/ai/generate
 *
 * Example: "Create a contact form for my salon with name, email, phone, and preferred service"
 */
aiRoutes.post('/generate', async (req, res) => {
  try {
    const { prompt, userId } = generateFormSchema.parse(req.body);
    const user = userId || req.headers['x-user-id'] as string || 'anonymous';

    // Detect form type
    const formType = detectFormType(prompt);

    // Generate form structure
    const generated = await generateFormFromText(prompt, user);

    res.json({
      formType,
      blocks: generated.blocks,
      fields: generated.fields,
      suggestedSettings: generated.suggestedSettings,
      suggestedWorkflows: generated.suggestedWorkflows,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('AI generate error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Generate and save form from natural language
 * POST /api/ai/generate/save
 *
 * One endpoint to generate AND save the form
 */
aiRoutes.post('/generate/save', async (req, res) => {
  try {
    const { prompt, title, userId } = z.object({
      prompt: z.string().min(10).max(1000),
      title: z.string().min(1).max(200).optional(),
      userId: z.string().optional(),
    }).parse(req.body);

    const user = userId || req.headers['x-user-id'] as string || 'anonymous';

    // Generate form
    const generated = await generateFormFromText(prompt, user);

    // Create the form
    const form = await createForm({
      userId: user,
      title: title || `AI Generated - ${detectFormType(prompt)} form`,
      description: `Generated from: "${prompt}"`,
      blocks: generated.blocks,
      fields: generated.fields,
      settings: generated.suggestedSettings,
      aiGenerated: true,
      aiPrompt: prompt,
    });

    // Add suggested workflows
    for (const workflow of generated.suggestedWorkflows) {
      form.workflows.push(workflow as any);
    }

    res.status(201).json({
      form,
      formType: detectFormType(prompt),
      message: 'Form generated and saved successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('AI generate save error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Suggest field enhancements
 * POST /api/ai/enhance
 */
aiRoutes.post('/enhance', async (req, res) => {
  try {
    const { fields } = z.object({
      fields: z.array(z.any()),
    }).parse(req.body);

    const enhanced = await suggestEnhancements(fields);

    res.json({
      originalCount: fields.length,
      enhancedCount: enhanced.length,
      addedFields: enhanced.slice(fields.length),
      enhancedFields: enhanced,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('AI enhance error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Detect form type
 * POST /api/ai/detect-type
 */
aiRoutes.post('/detect-type', async (req, res) => {
  try {
    const { prompt } = z.object({
      prompt: z.string().min(10).max(1000),
    }).parse(req.body);

    const formType = detectFormType(prompt);

    // Return type with suggested fields
    const suggestions: Record<string, { title: string; fields: string[] }> = {
      contact: {
        title: 'Contact Form',
        fields: ['Name', 'Email', 'Phone', 'Message'],
      },
      feedback: {
        title: 'Feedback Form',
        fields: ['Rating', 'What you liked', 'Improvements', 'Comments'],
      },
      job: {
        title: 'Job Application',
        fields: ['Full Name', 'Email', 'Phone', 'Resume', 'Cover Letter'],
      },
      event: {
        title: 'Event Registration',
        fields: ['Name', 'Email', 'Number of Attendees', 'Dietary Requirements'],
      },
      appointment: {
        title: 'Appointment Booking',
        fields: ['Name', 'Email', 'Phone', 'Preferred Date', 'Preferred Time', 'Service'],
      },
      onboarding: {
        title: 'Customer Onboarding',
        fields: ['Full Name', 'Email', 'Company', 'Goals'],
      },
      survey: {
        title: 'Survey',
        fields: ['Rating Scale', 'Multiple Choice', 'Text Response'],
      },
      healthcare: {
        title: 'Health Intake Form',
        fields: ['Name', 'DOB', 'Emergency Contact', 'Symptoms', 'Medical History'],
      },
      order: {
        title: 'Order Form',
        fields: ['Name', 'Email', 'Phone', 'Address', 'Payment Method'],
      },
      general: {
        title: 'General Form',
        fields: ['Name', 'Email', 'Your Question'],
      },
    };

    res.json({
      formType,
      suggestion: suggestions[formType] || suggestions.general,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('AI detect type error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Suggest conditional logic
 * POST /api/ai/conditional-logic
 */
aiRoutes.post('/conditional-logic', async (req, res) => {
  try {
    const { fields } = z.object({
      fields: z.array(z.any()),
    }).parse(req.body);

    await suggestConditionalLogic(fields);

    // Return suggested conditional logic rules
    const suggestions: any[] = [];

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];

      // Suggest follow-ups based on field type
      if (field.type === 'yes_no') {
        suggestions.push({
          trigger: { fieldId: field.id, value: 'Yes' },
          action: 'show',
          targetFieldIndex: i + 1 < fields.length ? i + 1 : null,
          description: `If "${field.question}" is Yes, show next field`,
        });
      }

      if (field.type === 'multiple_choice' && field.options?.length) {
        suggestions.push({
          trigger: { fieldId: field.id, value: field.options[0] },
          action: 'show',
          targetFieldIndex: i + 1 < fields.length ? i + 1 : null,
          description: `If "${field.question}" is "${field.options[0]}", show next field`,
        });
      }
    }

    res.json({
      suggestions,
      total: suggestions.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('AI conditional logic error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Analyze form for improvements
 * POST /api/ai/analyze
 */
aiRoutes.post('/analyze', async (req, res) => {
  try {
    const { fields, title, description } = z.object({
      fields: z.array(z.any()),
      title: z.string().optional(),
      description: z.string().optional(),
    }).parse(req.body);

    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for missing essential fields
    const hasName = fields.some((f: any) => f.type === 'short_text');
    const hasEmail = fields.some((f: any) => f.type === 'email');
    const hasPhone = fields.some((f: any) => f.type === 'phone');

    if (!hasName) {
      issues.push('Form is missing a name field');
      suggestions.push('Add a short text field for "Name"');
    }

    if (!hasEmail) {
      issues.push('Form is missing an email field');
      suggestions.push('Add an email field for follow-ups');
    }

    if (!hasPhone) {
      suggestions.push('Consider adding a phone field for better contact options');
    }

    // Check for long text without context
    const longTextFields = fields.filter((f: any) => f.type === 'long_text');
    for (const field of longTextFields) {
      if (!field.description && !field.placeholder) {
        suggestions.push(`Add a placeholder or description to "${field.question}" to guide users`);
      }
    }

    // Check for multiple choice without "Other"
    const choiceFields = fields.filter((f: any) => f.type === 'multiple_choice');
    for (const field of choiceFields) {
      if (field.options?.length >= 4 && !field.options.includes('Other')) {
        suggestions.push(`Consider adding "Other" option to "${field.question}"`);
      }
    }

    // Check form length
    if (fields.length > 15) {
      issues.push('Form has more than 15 fields - may reduce completion rate');
      suggestions.push('Consider splitting into multiple forms');
    }

    // Check for required fields
    const requiredFields = fields.filter((f: any) => f.required);
    if (requiredFields.length === 0) {
      suggestions.push('Consider marking key fields as required');
    }

    res.json({
      score: Math.max(0, 100 - issues.length * 20 - suggestions.length * 5),
      issues,
      suggestions,
      summary: issues.length === 0 ? 'Form looks good!' : `Found ${issues.length} issues and ${suggestions.length} suggestions`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('AI analyze error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Get AI suggestions for form optimization
 * POST /api/ai/optimize
 */
aiRoutes.post('/optimize', async (req, res) => {
  try {
    const { formId } = z.object({
      formId: z.string().uuid(),
    }).parse(req.body);

    // In production, analyze form performance and suggest improvements
    // based on submission rates, drop-off points, etc.

    res.json({
      suggestions: [
        {
          type: 'conversion',
          title: 'Reduce friction',
          description: 'Remove non-essential required fields to increase submission rate',
          impact: 'high',
        },
        {
          type: 'engagement',
          title: 'Add progress bar',
          description: 'Show users how far they are in the form',
          impact: 'medium',
        },
        {
          type: 'automation',
          title: 'Enable auto-follow up',
          description: 'Set up email workflow for new submissions',
          impact: 'medium',
        },
      ],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('AI optimize error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});