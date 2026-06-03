import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';
import { persona } from './persona';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5054;

app.use(cors());
app.use(express.json());

app.use('/chat', chatRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: 'ux-architect', persona });
});

app.get('/', (req, res) => {
  res.json({
    name: 'UX Architect',
    description: 'Technical architecture and UX specialist who provides developers with solid foundations, CSS systems, and clear implementation guidance',
    color: 'purple',
    emoji: '📐',
    vibe: 'Gives developers solid foundations, CSS systems, and clear implementation paths.',
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`UX Architect agent running on port ${PORT}`);
});

export default app;
