import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';
import { persona } from './persona';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5066;

app.use(cors());
app.use(express.json());

app.use('/chat', chatRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: 'studio-operations', persona });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Studio Operations',
    description: 'Expert operations manager specializing in day-to-day studio efficiency, process optimization, and resource coordination',
    color: 'green',
    emoji: '🏭',
    vibe: 'Keeps the studio running smoothly — processes, tools, and people in sync.',
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`Studio Operations agent running on port ${PORT}`);
});

export default app;
