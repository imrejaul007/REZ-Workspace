/**
 * QR domain router.
 */
import { Router } from 'express';
import qrRoutes from '../routes/qr';

const router = Router();

router.use('/qr', qrRoutes);

export default router;
