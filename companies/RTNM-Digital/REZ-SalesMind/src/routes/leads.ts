/**
 * Leads Routes - Lead management and enrichment
 */

import { Router } from 'express';
import { IntelligenceEngine } from '../services/intelligenceEngine.js';
import { HojaiAIClient } from '../services/hojaiClient.js';

export const leadRoutes = (
  intelligenceEngine: IntelligenceEngine,
  hojaiClient: HojaiAIClient
) => {
  const router = Router();

  // Get all leads
  router.get('/', async (req, res) => {
    try {
      const { stage, owner } = req.query;
      const leads = await intelligenceEngine.getCRMClient().getLeads({
        stage: stage as string,
        owner: owner as string
      });

      res.json({ leads, count: leads.length });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  // Get lead by ID
  router.get('/:leadId', async (req, res) => {
    try {
      const { leadId } = req.params;
      const lead = await intelligenceEngine.getCRMClient().getLead(leadId);

      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      res.json(lead);
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ error: 'Failed to fetch lead' });
    }
  });

  // Create new lead
  router.post('/', async (req, res) => {
    try {
      const leadData = req.body;
      const lead = await intelligenceEngine.getCRMClient().createLead(leadData);

      if (!lead) {
        return res.status(500).json({ error: 'Failed to create lead' });
      }

      res.status(201).json(lead);
    } catch (error) {
      console.error('Error creating lead:', error);
      res.status(500).json({ error: 'Failed to create lead' });
    }
  });

  // Update lead stage
  router.patch('/:leadId/stage', async (req, res) => {
    try {
      const { leadId } = req.params;
      const { stage } = req.body;

      const success = await intelligenceEngine.getCRMClient().updateLeadStage(leadId, stage);

      if (!success) {
        return res.status(500).json({ error: 'Failed to update lead stage' });
      }

      res.json({ success: true, leadId, stage });
    } catch (error) {
      console.error('Error updating lead stage:', error);
      res.status(500).json({ error: 'Failed to update lead stage' });
    }
  });

  // Enrich lead with AI
  router.post('/:leadId/enrich', async (req, res) => {
    try {
      const { leadId } = req.params;
      const enriched = await hojaiClient.enrichLead(leadId);

      res.json({
        leadId,
        enriched: enriched || false,
        data: enriched
      });
    } catch (error) {
      console.error('Error enriching lead:', error);
      res.status(500).json({ error: 'Failed to enrich lead' });
    }
  });

  // Score lead with AI
  router.post('/:leadId/score', async (req, res) => {
    try {
      const { leadId } = req.params;
      const lead = await intelligenceEngine.getCRMClient().getLead(leadId);

      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const scoring = await hojaiClient.scoreLead(lead);

      res.json({
        leadId,
        score: scoring.score,
        factors: scoring.factors,
        recommendations: scoring.recommendations
      });
    } catch (error) {
      console.error('Error scoring lead:', error);
      res.status(500).json({ error: 'Failed to score lead' });
    }
  });

  return router;
};