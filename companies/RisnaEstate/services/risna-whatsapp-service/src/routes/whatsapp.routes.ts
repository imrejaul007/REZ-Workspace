import { Router, Request, Response, NextFunction } from 'express';
import { whatsappService } from '../services/whatsappService';
import { successResponse } from '../utils/response';

const router = Router();

// Webhook for WhatsApp incoming messages
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, message, name } = req.body;
    const result = await whatsappService.handleIncomingMessage(phone, message, name);
    successResponse(res, result);
  } catch (err) { next(err); }
});

// Send message
router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, message } = req.body;
    await whatsappService.sendMessage(phone, message);
    successResponse(res, { sent: true });
  } catch (err) { next(err); }
});

// Send brochure
router.post('/brochure', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, propertyId } = req.body;
    await whatsappService.sendBrochure(phone, propertyId);
    successResponse(res, { sent: true });
  } catch (err) { next(err); }
});

// Send visit confirmation
router.post('/visit-confirmation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, propertyName, date, time } = req.body;
    await whatsappService.sendVisitConfirmation(phone, propertyName, date, time);
    successResponse(res, { sent: true });
  } catch (err) { next(err); }
});

// Send ROI calculation
router.post('/roi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, propertyName, roi, rentalYield } = req.body;
    await whatsappService.sendROICalculation(phone, propertyName, roi, rentalYield);
    successResponse(res, { sent: true });
  } catch (err) { next(err); }
});

// Get conversation
router.get('/conversation/:phone', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await whatsappService.getConversation(req.params.phone);
    successResponse(res, conversation);
  } catch (err) { next(err); }
});

// Get broker inquiries
router.get('/inquiries/:brokerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inquiries = await whatsappService.getBrokerInquiries(req.params.brokerId);
    successResponse(res, inquiries);
  } catch (err) { next(err); }
});

// Get unassigned inquiries
router.get('/inquiries/unassigned', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inquiries = await whatsappService.getUnassignedInquiries();
    successResponse(res, inquiries);
  } catch (err) { next(err); }
});

// Assign inquiry
router.post('/inquiries/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brokerId } = req.body;
    await whatsappService.assignInquiry(req.params.id, brokerId);
    successResponse(res, { assigned: true });
  } catch (err) { next(err); }
});

// Convert inquiry to lead
router.post('/inquiries/:id/convert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await whatsappService.convertInquiry(req.params.id);
    successResponse(res, { converted: true });
  } catch (err) { next(err); }
});

// Setup auto-replies
router.post('/auto-replies/setup', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await whatsappService.setupAutoReplies();
    successResponse(res, { configured: true });
  } catch (err) { next(err); }
});

export default router;
