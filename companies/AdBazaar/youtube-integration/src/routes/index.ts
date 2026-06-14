import { Router } from 'express';
import authRoutes from './auth.js';
import channelRoutes from './channels.js';
import videoRoutes from './videos.js';
import playlistRoutes from './playlists.js';
import commentRoutes from './comments.js';
import liveRoutes from './live.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/channels', channelRoutes);
router.use('/videos', videoRoutes);
router.use('/playlists', playlistRoutes);
router.use('/comments', commentRoutes);
router.use('/live', liveRoutes);

export default router;