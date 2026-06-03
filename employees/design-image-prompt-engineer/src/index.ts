import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';
import { persona } from './persona';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5051;

app.use(cors());
app.use(express.json());

app.use('/chat', chatRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: 'image-prompt-engineer', persona });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Image Prompt Engineer',
    description: 'Expert photography prompt engineer specializing in crafting detailed, evocative prompts for AI image generation',
    color: 'amber',
    emoji: '📷',
    vibe: 'Translates visual concepts into precise prompts that produce stunning AI photography.',
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`Image Prompt Engineer agent running on port ${PORT}`);
});

export default app;
