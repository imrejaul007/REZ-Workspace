import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';
import { persona } from './persona';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5053;

app.use(cors());
app.use(express.json());

app.use('/chat', chatRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: 'ui-designer', persona });
});

app.get('/', (req, res) => {
  res.json({
    name: 'UI Designer',
    description: 'Expert UI designer specializing in visual design systems, component libraries, and pixel-perfect interface creation',
    color: 'purple',
    emoji: '🎨',
    vibe: 'Creates beautiful, consistent, accessible interfaces that feel just right.',
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`UI Designer agent running on port ${PORT}`);
});

export default app;
