/**
 * Interviewer AI Agent - Port 4012
 * Conduct interviews, score candidates
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Store interviews
const interviews: Map<string, any> = new Map();
const questions = {
  technical: [
    'Explain the difference between var, let, and const',
    'What is the virtual DOM?',
    'Describe your experience with TypeScript',
    'How do you handle async operations?',
  ],
  behavioral: [
    'Tell me about a challenging project',
    'How do you handle disagreements with teammates?',
    'Describe your ideal work environment',
  ],
  system: [
    'Design a URL shortener',
    'Explain how you would scale a web application',
    'Describe your testing strategy',
  ],
};

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'interviewer', port: 4012 }));

// Get questions
app.get('/questions/:type', (req, res) => {
  const type = req.params.type as keyof typeof questions;
  if (!questions[type]) {
    return res.status(400).json({ error: 'Invalid interview type' });
  }
  res.json({ type, questions: questions[type] });
});

// Start interview
app.post('/interview/start', (req, res) => {
  const { candidateId, jobId, type = 'technical' } = req.body;

  const interviewId = `int_${Date.now()}`;
  const interview = {
    id: interviewId,
    candidateId,
    jobId,
    type,
    questions: questions[type as keyof typeof questions] || questions.technical,
    startedAt: new Date(),
    status: 'in_progress',
    responses: [],
    scores: {},
  };

  interviews.set(interviewId, interview);

  res.json({
    interviewId,
    candidateId,
    type,
    currentQuestion: 0,
    totalQuestions: interview.questions.length,
    question: interview.questions[0],
    status: 'started',
  });
});

// Submit answer
app.post('/interview/answer', (req, res) => {
  const { interviewId, questionIndex, answer, rating } = req.body;

  const interview = interviews.get(interviewId);
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }

  interview.responses[questionIndex] = { answer, rating, timestamp: new Date() };

  const nextIndex = questionIndex + 1;
  const completed = nextIndex >= interview.questions.length;

  res.json({
    interviewId,
    questionIndex: nextIndex,
    completed,
    nextQuestion: completed ? null : interview.questions[nextIndex],
    progress: `${nextIndex}/${interview.questions.length}`,
  });
});

// End interview and get results
app.post('/interview/end', (req, res) => {
  const { interviewId } = req.body;

  const interview = interviews.get(interviewId);
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }

  interview.status = 'completed';
  interview.completedAt = new Date();

  // Calculate scores
  const scores = interview.responses
    .filter((r: any) => r)
    .map((r: any) => r.rating || 3);
  const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;

  const overallScore = Math.round(avgScore * 20); // Convert to 100
  const recommendation = overallScore >= 70 ? 'strong_hire' : overallScore >= 50 ? 'hire' : overallScore >= 30 ? 'no_hire' : 'strong_no_hire';

  res.json({
    interviewId,
    status: 'completed',
    overallScore,
    recommendation,
    breakdown: {
      technical: Math.round(overallScore * 1.1),
      communication: Math.round(overallScore * 0.9),
      culture: Math.round(overallScore * 0.95),
    },
    feedback: `Average rating: ${avgScore.toFixed(1)}/5. ${recommendation === 'hire' || recommendation === 'strong_hire' ? 'Recommend proceeding with hiring.' : 'May need to reconsider.'}`,
    responses: interview.responses,
  });
});

// Get interview status
app.get('/interview/:id', (req, res) => {
  const interview = interviews.get(req.params.id);
  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }
  res.json({ interview });
});

const PORT = 4012;
app.listen(PORT, () => logger.info(`Interviewer Agent running on port ${PORT}`));
