/**
 * Atlas Workforce Training - AI Training & Assessments
 * Continuous learning and skill development platform
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5235;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-workforce-training', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/courses', (req: Request, res: Response) => {
  res.json({
    courses: [
      { id: '1', title: 'Sales Excellence', modules: 8, duration: '4h', enrolled: 45 },
      { id: '2', title: 'Product Knowledge', modules: 12, duration: '6h', enrolled: 38 },
      { id: '3', title: 'Customer Engagement', modules: 6, duration: '3h', enrolled: 52 }
    ]
  });
});

app.get('/api/assessments/:courseId', (req: Request, res: Response) => {
  res.json({
    assessmentId: 'assess-1',
    questions: [
      { id: '1', question: 'What is the best approach for cold calling?', options: ['A', 'B', 'C', 'D'], correct: 2 },
      { id: '2', question: 'How to handle objections?', options: ['A', 'B', 'C', 'D'], correct: 0 }
    ]
  });
});

app.listen(PORT, () => console.log(`🎓 Atlas Workforce Training running on port ${PORT}`));
export default app;
