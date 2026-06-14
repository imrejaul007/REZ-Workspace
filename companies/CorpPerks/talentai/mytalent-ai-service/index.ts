import { logger } from '../../shared/logger';
/**
 * MyTalent AI - Main Service
 * All employee types
 * Port: 4006
 */

import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4006;

// Types
interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  level: string;
  manager: string;
  team: string[];
}

// Team listing
app.get('/api/team', (req, res) => {
  const { department } = req.query;

  const team = [
    { id: '1', name: 'Priya', role: 'Developer', department: 'Engineering', level: 'L4' },
    { id: '2', name: 'Rahul', role: 'Designer', department: 'Design', level: 'L3' },
    { id: '3', name: 'Anita', role: 'Marketing', department: 'Marketing', level: 'L5' }
  ];

  res.json({ team: department ? team.filter(e => e.department === department) : team });
});

// Employee profile
app.get('/api/employee/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'Employee',
    skills: ['JavaScript', 'React'],
    projects: ['E-commerce', 'App'],
    careerPath: ['Junior Dev', 'Senior Dev', 'Tech Lead', 'Manager']
  });
});

// HR queries
app.post('/api/ask', (req, res) => {
  const { query } = req.body;
  const q = (query || '').toLowerCase();

  let response = 'I can help with HR queries. Ask about leave, policies, team, skills, careers';

  if (q.includes('leave') || q.includes('holiday')) {
    response = 'Leave Policy:\n15 CL + 12 SL + 5 PL\n\nApply via app → Manager → HR';
  } else if (q.includes('salary') || q.includes('appraisal') || q.includes('raisal')) {
    response = 'Appraisal Cycle: April\nCurrent: Q4 Review\nHike: 8-15% based on performance';
  } else if (q.includes('policy') || q.includes('wfh') || q.includes('office')) {
    response = 'WFH: 2 days/week\nOffice: 3 days/week\nCore hours: 10 AM - 7 PM';
  } else if (q.includes('team') || q.includes('org')) {
    response = 'Team Structure:\n1 Manager\n4 Seniors\n6 Mid-level\n10 Juniors';
  }

  res.json({ response, source: 'MyTalent AI' });
});

app.listen(PORT, () => {
  logger.info(`MyTalent AI running on port ${PORT}`);
});

export default app;
</parameter>
