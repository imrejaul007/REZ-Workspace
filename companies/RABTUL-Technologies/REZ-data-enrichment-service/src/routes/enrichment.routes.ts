/**
 * Data Enrichment Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { enrichmentService } from '../services/enrichmentService';

export const enrichmentRouter = Router();

// Validation schemas
const contactEnrichSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  domain: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  waterfall: z.object({
    providers: z.array(z.string()).optional(),
    fallbackOrder: z.array(z.string()).optional(),
    maxProviders: z.number().optional(),
    stopOnFirstMatch: z.boolean().optional(),
  }).optional(),
  forceRefresh: z.boolean().optional(),
});

const companyEnrichSchema = z.object({
  name: z.string().optional(),
  domain: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  waterfall: z.object({
    providers: z.array(z.string()).optional(),
    maxProviders: z.number().optional(),
  }).optional(),
});

const bulkContactSchema = z.object({
  records: z.array(z.object({
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    domain: z.string().optional(),
  })).min(1).max(1000),
  waterfall: z.object({
    providers: z.array(z.string()).optional(),
    maxProviders: z.number().optional(),
  }).optional(),
});

const bulkCompanySchema = z.object({
  records: z.array(z.object({
    name: z.string().optional(),
    domain: z.string().optional(),
  })).min(1).max(1000),
  waterfall: z.object({
    providers: z.array(z.string()).optional(),
    maxProviders: z.number().optional(),
  }).optional(),
});

// POST /api/v1/enrich/contact
enrichmentRouter.post('/contact', async (req: Request, res: Response) => {
  try {
    const params = contactEnrichSchema.parse(req.body);

    if (!params.email && !params.firstName && !params.lastName && !params.company) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'At least one search parameter required' }
      });
      return;
    }

    const result = await enrichmentService.waterfallEnrichContact(params, params.waterfall);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Enrichment failed' } });
    }
  }
});

// POST /api/v1/enrich/company
enrichmentRouter.post('/company', async (req: Request, res: Response) => {
  try {
    const params = companyEnrichSchema.parse(req.body);

    if (!params.name && !params.domain) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name or domain required' }
      });
      return;
    }

    const result = await enrichmentService.waterfallEnrichCompany(params, params.waterfall);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Enrichment failed' } });
    }
  }
});

// POST /api/v1/enrich/bulk/contacts
enrichmentRouter.post('/bulk/contacts', async (req: Request, res: Response) => {
  try {
    const params = bulkContactSchema.parse(req.body);
    const result = await enrichmentService.bulkEnrich({
      type: 'contact',
      records: params.records,
      waterfall: params.waterfall,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Bulk enrichment failed' } });
    }
  }
});

// POST /api/v1/enrich/bulk/companies
enrichmentRouter.post('/bulk/companies', async (req: Request, res: Response) => {
  try {
    const params = bulkCompanySchema.parse(req.body);
    const result = await enrichmentService.bulkEnrich({
      type: 'company',
      records: params.records,
      waterfall: params.waterfall,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Bulk enrichment failed' } });
    }
  }
});

// GET /api/v1/enrich/providers
enrichmentRouter.get('/providers', async (_req: Request, res: Response) => {
  try {
    const providers = enrichmentService.getProviders();
    res.json({ success: true, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch providers' } });
  }
});

// POST /api/v1/enrich/verify/email
enrichmentRouter.post('/verify/email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email required' } });
      return;
    }

    const isValid = await enrichmentService.verifyEmail(email);
    res.json({ success: true, data: { email, valid: isValid } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Verification failed' } });
  }
});

// POST /api/v1/enrich/find/phone
enrichmentRouter.post('/find/phone', async (req: Request, res: Response) => {
  try {
    const { company, title } = req.body;
    if (!company) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Company required' } });
      return;
    }

    const phone = await enrichmentService.findPhone(company, title);
    res.json({ success: true, data: { company, title, phone } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Phone lookup failed' } });
  }
});
