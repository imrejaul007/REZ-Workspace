/**
 * Engagement Agent - Port 4021
 * Pulse surveys, sentiment, culture
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Surveys
const surveys: Map<string, any> = new Map();
const responses: Map<string, any> = new Map();

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'engagement', port: 4021 }));

// Create pulse survey
app.post('/survey', (req, res) => {
  const { title, questions, target } = req.body;

  const surveyId = `survey_${Date.now()}`;
  const survey = {
    id: surveyId,
    title,
    questions,
    target: target || 'all',
    status: 'active',
    createdAt: new Date(),
    closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    responseCount: 0,
  };

  surveys.set(surveyId, survey);

  res.json({ survey });
});

// Submit response
app.post('/survey/:id/respond', (req, res) => {
  const { employeeId, answers, sentiment } = req.body;

  const survey = surveys.get(req.params.id);
  if (!survey) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  const responseId = `resp_${Date.now()}`;
  const response = {
    id: responseId,
    surveyId: req.params.id,
    employeeId,
    answers,
    sentiment: sentiment || 'neutral',
    submittedAt: new Date(),
  };

  responses.set(responseId, response);
  survey.responseCount++;

  res.json({ response, message: 'Thank you for your feedback!' });
});

// Get survey results
app.get('/survey/:id/results', (req, res) => {
  const survey = surveys.get(req.params.id);
  if (!survey) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  const surveyResponses = Array.from(responses.values())
    .filter(r => r.surveyId === req.params.id);

  // Aggregate sentiment
  const sentimentCounts = surveyResponses.reduce((acc: any, r) => {
    acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
    return acc;
  }, {});

  const avgSentiment = surveyResponses.length > 0
    ? surveyResponses.reduce((sum, r) => {
      const val = r.sentiment === 'positive' ? 1 : r.sentiment === 'negative' ? -1 : 0;
      return sum + val;
    }, 0) / surveyResponses.length
    : 0;

  res.json({
    survey,
    summary: {
      totalResponses: surveyResponses.length,
      responseRate: Math.round((surveyResponses.length / 45) * 100),
      avgSentiment: avgSentiment.toFixed(2),
      sentimentBreakdown: sentimentCounts,
    },
  });
});

// Get engagement dashboard
app.get('/dashboard', (_, res) => {
  res.json({
    metrics: {
      engagementScore: 78,
      pulseResponseRate: 85,
      nps: 45,
      esi: 72,
      participationRate: 68,
    },
    trends: {
      engagement: '+5%',
      satisfaction: '+3%',
      retention: 'stable',
    },
    topInitiatives: [
      { name: 'Team Lunches', participation: 92 },
      { name: 'Learning Programs', participation: 78 },
      { name: 'Recognition Program', participation: 65 },
    ],
    concerns: [
      { topic: 'Work-life balance', sentiment: -0.3 },
      { topic: 'Career growth', sentiment: 0.1 },
      { topic: 'Manager feedback', sentiment: 0.5 },
    ],
  });
});

// AI insights
app.get('/insights', (_, res) => {
  res.json({
    insights: [
      {
        type: 'trend',
        title: 'Engagement Trending Up',
        description: 'Employee engagement increased 5% this quarter',
        confidence: 92,
      },
      {
        type: 'alert',
        title: 'Workload Concerns',
        description: '15% of responses mention high workload',
        confidence: 88,
      },
      {
        type: 'opportunity',
        title: 'Recognition Gap',
        description: 'Team members feel recognition is unevenly distributed',
        confidence: 85,
      },
    ],
  });
});

const PORT = 4021;
app.listen(PORT, () => logger.info(`Engagement Agent running on port ${PORT}`));
