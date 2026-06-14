/**
 * Video Transcoding Service - Process video ads
 * Port: 4740
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

interface VideoJob {
  id: string; advertiserId: string; inputUrl: string; status: 'queued' | 'processing' | 'completed' | 'failed';
  outputs: Array<{ format: string; resolution: string; url: string; size: number }>;
  progress: number; createdAt: Date; completedAt?: Date;
}

const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());
const PORT = parseInt(process.env.PORT || '4740', 10);

const jobs: VideoJob[] = [
  {
    id: 'vj_001', advertiserId: 'adv_001', inputUrl: 'https://cdn.example.com/input.mp4', status: 'completed',
    outputs: [
      { format: 'mp4', resolution: '1080p', url: 'https://cdn.example.com/output/1080p.mp4', size: 15000000 },
      { format: 'mp4', resolution: '720p', url: 'https://cdn.example.com/output/720p.mp4', size: 8000000 },
      { format: 'mp4', resolution: '480p', url: 'https://cdn.example.com/output/480p.mp4', size: 4000000 },
    ],
    progress: 100, createdAt: new Date('2026-05-25'), completedAt: new Date('2026-05-25')
  },
];

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'video-transcoding' }));
app.get('/api/jobs', (_, res) => res.json({ success: true, data: jobs }));
app.get('/api/jobs/:id', (req, res) => { const j = jobs.find(x => x.id === req.params.id); if (!j) return res.status(404).json({ success: false }); res.json({ success: true, data: j }); });
app.post('/api/jobs', (req, res) => {
  const { advertiserId, inputUrl, formats, resolutions } = req.body;
  const j: VideoJob = { id: `vj_${Date.now()}`, advertiserId, inputUrl, status: 'queued', outputs: [], progress: 0, createdAt: new Date() };
  jobs.push(j);
  setTimeout(() => { j.status = 'processing'; j.progress = 50; }, 1000);
  setTimeout(() => { j.status = 'completed'; j.progress = 100; j.completedAt = new Date(); j.outputs = [{ format: 'mp4', resolution: '1080p', url: `${inputUrl.replace('/input', '/output/1080p')}`, size: 10000000 }]; }, 3000);
  res.json({ success: true, data: j });
});
app.listen(PORT, () => logger.info(`[Video Transcoding] Running on port ${PORT}`));
export default app;
