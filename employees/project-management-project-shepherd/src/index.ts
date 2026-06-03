import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';
import { persona } from './persona';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5065;

app.use(cors());
app.use(express.json());

app.use('/chat', chatRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: 'project-shepherd', persona });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Project Shepherd',
    description: 'Expert project manager specializing in cross-functional project coordination, timeline management, and stakeholder alignment',
    color: 'blue',
    emoji: '🐑',
    vibe: 'Herds cross-functional chaos into on-time, on-scope delivery.',
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`Project Shepherd agent running on port ${PORT}`);
});

export default app;
