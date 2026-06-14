import { Router } from 'express';
import { agreementController } from '../controllers/agreement.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Agreement Management
router.post(
  '/',
  validateRequest,
  agreementController.createAgreement
);

router.get(
  '/',
  validateRequest,
  agreementController.listAgreements
);

router.get(
  '/:id',
  validateRequest,
  agreementController.getAgreement
);

router.put(
  '/:id',
  validateRequest,
  agreementController.updateAgreement
);

router.delete(
  '/:id',
  validateRequest,
  agreementController.deleteAgreement
);

// Agreement Generation
router.post(
  '/:id/generate',
  validateRequest,
  agreementController.generatePdf
);

router.get(
  '/:id/pdf',
  validateRequest,
  agreementController.downloadPdf
);

router.post(
  '/:id/templates',
  validateRequest,
  agreementController.getTemplates
);

router.post(
  '/:id/preview',
  validateRequest,
  agreementController.previewAgreement
);

// E-Signing
router.post(
  '/:id/sign/buyer',
  validateRequest,
  agreementController.signBuyer
);

router.post(
  '/:id/sign/seller',
  validateRequest,
  agreementController.signSeller
);

router.post(
  '/:id/sign/witness',
  validateRequest,
  agreementController.signWitness
);

router.get(
  '/:id/signatures',
  validateRequest,
  agreementController.getSignatureStatus
);

// Registration
router.post(
  '/:id/register',
  validateRequest,
  agreementController.submitForRegistration
);

router.post(
  '/:id/registered',
  validateRequest,
  agreementController.markAsRegistered
);

router.get(
  '/:id/registration-status',
  validateRequest,
  agreementController.getRegistrationStatus
);

// Payments
router.post(
  '/:id/payments',
  validateRequest,
  agreementController.addPayment
);

router.get(
  '/:id/payments',
  validateRequest,
  agreementController.getPaymentSchedule
);

router.post(
  '/:id/payments/:paymentId/confirm',
  validateRequest,
  agreementController.confirmPayment
);

// Statistics
router.get(
  '/stats/overview',
  validateRequest,
  agreementController.getStatistics
);

export default router;