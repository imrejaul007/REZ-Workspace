/**
 * Ecosystem Routes - Connect to all RTNM services
 */

import { Router } from 'express';
import { prospectingConnector, communicationConnector, intelligenceConnector, identityConnector, crmConnector, bookingConnector, conversationIntelConnector } from '../services/ecosystemConnector.js';
import { aiSalesAgent, SalesWorkflowInput } from '../services/salesWorkflow.js';

const router = Router();

// PROSPECTING
router.get('/prospecting/search', async (req, res) => {
  try {
    const results = await prospectingConnector.searchProspects(req.query.q as string);
    res.json({ results, count: results.length });
  } catch (error) { res.status(500).json({ error: 'Search failed' }); }
});

// COMMUNICATION
router.post('/communication/email', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const sent = await communicationConnector.sendEmail(to, subject, body);
    res.json({ success: sent });
  } catch (error) { res.status(500).json({ error: 'Email failed' }); }
});

router.post('/communication/sms', async (req, res) => {
  try {
    const { to, message } = req.body;
    const sent = await communicationConnector.sendSMS(to, message);
    res.json({ success: sent });
  } catch (error) { res.status(500).json({ error: 'SMS failed' }); }
});

router.post('/communication/call', async (req, res) => {
  try {
    const { phone } = req.body;
    const result = await communicationConnector.makeCall(phone);
    res.json({ success: result });
  } catch (error) { res.status(500).json({ error: 'Call failed' }); }
});

// MARKET INTELLIGENCE
router.get('/intelligence/market-signals', async (req, res) => {
  try {
    const signals = await intelligenceConnector.getMarketSignals(req.query.industry as string);
    res.json({ signals, count: signals.length });
  } catch (error) { res.status(500).json({ error: 'Market signals failed' }); }
});

// IDENTITY
router.get('/identity/profile/:personId', async (req, res) => {
  try {
    const profile = await identityConnector.getUnifiedProfile(req.params.personId);
    res.json(profile);
  } catch (error) { res.status(500).json({ error: 'Profile failed' }); }
});

router.get('/identity/conversation-history', async (req, res) => {
  try {
    const { clientId, leadId } = req.query;
    const history = await identityConnector.getConversationHistory(clientId as string, leadId as string);
    res.json({ history });
  } catch (error) { res.status(500).json({ error: 'History failed' }); }
});

// CRM
router.get('/crm/leads', async (req, res) => {
  try {
    const leads = await crmConnector.getLeads(req.query as any);
    res.json({ leads, count: leads.length });
  } catch (error) { res.status(500).json({ error: 'Leads failed' }); }
});

router.get('/crm/deals', async (req, res) => {
  try {
    const deals = await crmConnector.getDeals(req.query as any);
    res.json({ deals, count: deals.length });
  } catch (error) { res.status(500).json({ error: 'Deals failed' }); }
});

router.patch('/crm/leads/:leadId/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    const updated = await crmConnector.updateLeadStage(req.params.leadId, stage);
    res.json({ success: updated });
  } catch (error) { res.status(500).json({ error: 'Stage update failed' }); }
});

// AI WORKFLOW
router.post('/workflow/run', async (req, res) => {
  try {
    const input = req.body as SalesWorkflowInput;
    const result = await aiSalesAgent.runWorkflow(input);
    res.json(result);
  } catch (error) { res.status(500).json({ error: 'Workflow failed' }); }
});

router.post('/workflow/outreach-sequence', async (req, res) => {
  try {
    const { prospectId, sequenceType } = req.body;
    const result = await aiSalesAgent.executeOutreachSequence(prospectId, sequenceType);
    res.json(result);
  } catch (error) { res.status(500).json({ error: 'Outreach failed' }); }
});

// CONVERSATION ANALYSIS
router.post('/conversation/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    const analysis = await aiSalesAgent.analyzeConversation(text);
    res.json(analysis);
  } catch (error) { res.status(500).json({ error: 'Analysis failed' }); }
});

// STATUS
router.get('/status', async (req, res) => {
  res.json({
    service: 'REZ SalesMind - Ecosystem Connector',
    version: '2.1.0',
    connectedServices: [
      { name: 'HOJAI Web Intelligence', port: 4595, status: 'connected' },
      { name: 'HOJAI Merchant Intel', port: 4751, status: 'connected' },
      { name: 'HOJAI Lead Service', port: 4752, status: 'connected' },
      { name: 'HOJAI Knowledge Graph', port: 4786, status: 'connected' },
      { name: 'HOJAI TwinOS', port: 4521, status: 'connected' },
      { name: 'Genie Voice', port: 4760, status: 'connected' },
      { name: 'REZ Identity Hub', port: 6000, status: 'connected' },
      { name: 'REZ CRM Hub', port: 6100, status: 'connected' },
      { name: 'AssetMind', port: 5000, status: 'connected' },
    ],
    timestamp: new Date().toISOString(),
  });
});

export default router;
