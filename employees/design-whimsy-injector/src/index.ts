import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';
import { persona } from './persona';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5057;

app.use(cors());
app.use(express.json());

app.use('/chat', chatRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: 'whimsy-injector', persona });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Whimsy Injector',
    description: 'Expert creative specialist focused on adding personality, delight, and playful elements to brand experiences',
    color: 'pink',
    emoji: '✨',
    vibe: 'Adds the unexpected moments of delight that make brands unforgettable.',
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`Whimsy Injector agent running on port ${PORT}`);
});

export default app;
