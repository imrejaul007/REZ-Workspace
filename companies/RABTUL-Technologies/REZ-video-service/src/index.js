/**
 * REZ Video Service - Loom Competitor
 * Async video messaging for teams
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

const app = express();
const PORT = process.env.PORT || 4102;

app.use(express.json());

// Configure multer for video uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// In-memory storage
const videos = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'REZ Video', version: '1.0.0' });
});

// Upload video
app.post('/api/videos/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const { userId, title, description } = req.body;

  const video = {
    id: uuidv4(),
    userId,
    title: title || 'Untitled Video',
    description: description || '',
    filename: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    duration: 0, // Would be extracted with FFmpeg
    thumbnail: null,
    url: `/videos/${uuidv4()}.mp4`, // Placeholder URL
    views: 0,
    status: 'processing',
    transcript: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  videos.set(video.id, video);

  // Simulate processing
  setTimeout(() => {
    video.status = 'ready';
    videos.set(video.id, video);
  }, 2000);

  res.status(201).json(video);
});

// List videos
app.get('/api/videos', (req, res) => {
  const userId = req.headers['x-user-id'];
  const userVideos = Array.from(videos.values())
    .filter(v => !userId || v.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);

  res.json({ videos: userVideos, total: userVideos.length });
});

// Get video
app.get('/api/videos/:id', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  res.json(video);
});

// Delete video
app.delete('/api/videos/:id', (req, res) => {
  if (!videos.has(req.params.id)) {
    return res.status(404).json({ error: 'Video not found' });
  }
  videos.delete(req.params.id);
  res.status(204).send();
});

// Track view
app.post('/api/videos/:id/view', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  video.views++;
  videos.set(video.id, video);

  res.json({ views: video.views });
});

// Get transcript
app.get('/api/videos/:id/transcript', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.json({
    transcript: video.transcript || 'Transcript not available yet.',
    segments: []
  });
});

// Generate transcript (simulated)
app.post('/api/videos/:id/transcript', async (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  // Simulate transcription
  video.transcript = `This is a simulated transcript for "${video.title}". In production, this would use a speech-to-text service.`;
  videos.set(video.id, video);

  res.json({ transcript: video.transcript, status: 'processing' });
});

// Add comment
app.post('/api/videos/:id/comments', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const { userId, userName, content, timestamp } = req.body;

  const comment = {
    id: uuidv4(),
    userId,
    userName: userName || 'Anonymous',
    content,
    timestamp: timestamp || 0,
    createdAt: new Date(),
  };

  if (!video.comments) {
    video.comments = [];
  }
  video.comments.push(comment);
  videos.set(video.id, video);

  res.status(201).json(comment);
});

// Get comments
app.get('/api/videos/:id/comments', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.json({ comments: video.comments || [] });
});

// Get analytics
app.get('/api/videos/:id/analytics', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.json({
    views: video.views,
    averageWatchTime: Math.floor(video.duration * 0.7) || 30,
    retentionRate: 0.75,
    topComments: (video.comments || []).slice(0, 5),
  });
});

// Embed code
app.get('/api/videos/:id/embed', (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const { autoplay, muted, loop } = req.query;

  res.json({
    iframe: `<iframe src="https://video.rez.money/embed/${video.id}"
      width="640" height="360"
      frameborder="0"
      ${autoplay ? 'autoplay' : ''}
      ${muted ? 'muted' : ''}
      allowfullscreen></iframe>`,
    url: `https://video.rez.money/watch/${video.id}`,
  });
});

app.listen(PORT, () => {
  console.log(`✅ REZ Video running on port ${PORT}`);
});

export default app;