/**
 * REZ Atlas v2 - Conversation Intelligence
 * Call Transcription, Analysis, Objection Extraction
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5183;

interface CallRecording {
  id: string;
  opportunityId: string;
  contactId: string;
  duration: number;
  transcript: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyPoints: string[];
  objections: string[];
  nextSteps: string[];
  actionItems: { task: string; assignee: string; dueDate: string }[];
  createdAt: string;
}

const recordings: Map<string, CallRecording> = new Map();

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'atlas-conversation-intel', version: '2.0.0' }));

// Analyze conversation
app.post('/api/analyze', (req, res) => {
  const { opportunityId, contactId, transcript, duration } = req.body;

  // Simulated AI analysis
  const analysis: CallRecording = {
    id: uuidv4(),
    opportunityId,
    contactId,
    duration: duration || 1800,
    transcript: transcript || 'Sample transcript...',
    summary: 'The prospect showed interest in the loyalty program. Main concern is implementation timeline. Budget confirmed at ₹15K/month.',
    sentiment: 'positive',
    keyPoints: [
      'Prospect runs a busy restaurant in Koramangala',
      'Currently manually tracking customer visits',
      'Interested in loyalty rewards feature',
      'Concerned about staff training',
      'Budget: ₹10-15K/month acceptable'
    ],
    objections: [
      'Implementation takes too long',
      'Staff might not adapt easily',
      'Need to see ROI first'
    ],
    nextSteps: [
      'Send product demo video',
      'Schedule follow-up call next week',
      'Prepare ROI calculator'
    ],
    actionItems: [
      { task: 'Send demo video', assignee: 'sales@rez.money', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
      { task: 'Schedule follow-up', assignee: 'sales@rez.money', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    createdAt: new Date().toISOString()
  };

  recordings.set(analysis.id, analysis);
  res.status(201).json(analysis);
});

// Get recordings
app.get('/api/recordings', (req, res) => {
  const { opportunityId, limit = 50 } = req.query;
  let result = Array.from(recordings.values());
  if (opportunityId) result = result.filter(r => r.opportunityId === opportunityId);
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ recordings: result.slice(0, Number(limit)), count: result.length });
});

// Get recording
app.get('/api/recordings/:id', (req, res) => {
  const recording = recordings.get(req.params.id);
  if (!recording) return res.status(404).json({ error: 'Recording not found' });
  res.json(recording);
});

// Analytics
app.get('/api/analytics', (req, res) => {
  const all = Array.from(recordings.values());

  res.json({
    totalCalls: all.length,
    avgDuration: Math.round(all.reduce((sum, r) => sum + r.duration, 0) / all.length) || 1800,
    sentimentBreakdown: {
      positive: all.filter(r => r.sentiment === 'positive').length,
      neutral: all.filter(r => r.sentiment === 'neutral').length,
      negative: all.filter(r => r.sentiment === 'negative').length
    },
    topObjections: ['Implementation time', 'Cost', 'Staff training', 'Integration'].map(o => ({
      objection: o,
      count: all.filter(r => r.objections.some(obj => obj.toLowerCase().includes(o.toLowerCase()))).length
    })),
    conversionRate: all.filter(r => r.sentiment === 'positive').length / all.length * 100
  });
});

app.listen(PORT, () => console.log(`🎙️ Atlas Conversation Intel running on port ${PORT}`));
export default app;