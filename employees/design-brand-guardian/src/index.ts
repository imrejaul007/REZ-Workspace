import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';
import { persona } from './persona';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

app.use('/chat', chatRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: 'brand-guardian', persona });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Brand Guardian Agent',
    description: 'Expert brand strategist and guardian specializing in brand identity development, consistency maintenance, and strategic brand positioning',
    color: 'blue',
    emoji: '🎨',
    vibe: "Your brand's fiercest protector and most passionate advocate.",
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`Brand Guardian agent running on port ${PORT}`);
});

export default app;
