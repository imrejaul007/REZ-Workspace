import { Router } from 'express';
import hashtagRoutes from './hashtag.routes';
import hashtagSetRoutes from './hashtag-set.routes';

const router = Router();

router.use('/hashtags', hashtagRoutes);
router.use('/hashtags/sets', hashtagSetRoutes);

export default router;