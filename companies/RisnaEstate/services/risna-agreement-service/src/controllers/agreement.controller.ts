import { Request, Response, NextFunction } from 'express';
import { agreementService } from '../services/agreement.service.js';
import { pdfService } from '../services/pdf.service.js';
import { templateService } from '../services/template.service.js';
import {
  CreateAgreementSchema,
  UpdateAgreementSchema,
  AddPaymentSchema,
  ESignSchema,
  RegisterAgreementSchema,
  QueryAgreementsSchema,
  TemplateSelectionSchema
} from '../schemas/agreement.schema.js';
import { AppError, getErrorMessage } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import path from 'path';

export class AgreementController {
  /**
   * Create a new agreement
   */
  createAgreement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = CreateAgreementSchema.parse(req.body);
      const userId = (req as any).user?.id || 'system';

      const agreement = await agreementService.createAgreement(validatedData, userId);

      res.status(201).json({
        success: true,
        message: 'Agreement created successfully',
        data: { agreement }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List agreements with filters
   */
  listAgreements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = QueryAgreementsSchema.parse(req.query);
      const result = await agreementService.listAgreements(query);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get agreement by ID
   */
  getAgreement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const agreement = await agreementService.getAgreementById(id);

      res.json({
        success: true,
        data: { agreement }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update agreement
   */
  updateAgreement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = UpdateAgreementSchema.parse(req.body);
      const userId = (req as any).user?.id || 'system';

      const agreement = await agreementService.updateAgreement(id, validatedData, userId);

      res.json({
        success: true,
        message: 'Agreement updated successfully',
        data: { agreement }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete agreement (soft delete)
   */
  deleteAgreement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || 'system';

      await agreementService.deleteAgreement(id, userId);

      res.json({
        success: true,
        message: 'Agreement deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate PDF agreement
   */
  generatePdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const agreement = await agreementService.getAgreementById(id);

      const pdfBuffer = await pdfService.generateAgreementPdf(agreement);
      const pdfPath = await pdfService.savePdf(agreement.agreementId, pdfBuffer);

      await agreementService.updatePdfUrl(agreement.agreementId, pdfPath);

      logger.info('PDF generated', { agreementId: agreement.agreementId, pdfPath });

      res.json({
        success: true,
        message: 'PDF generated successfully',
        data: {
          pdfUrl: pdfPath,
          agreementId: agreement.agreementId
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Download PDF
   */
  downloadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const agreement = await agreementService.getAgreementById(id);

      if (!agreement.agreementPdfUrl) {
        throw new AppError('PDF not generated yet', 404, 'PDF_NOT_FOUND');
      }

      res.download(agreement.agreementPdfUrl);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get available templates
   */
  getTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const templates = templateService.getAvailableTemplates();

      res.json({
        success: true,
        data: { templates }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Preview agreement (HTML)
   */
  previewAgreement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const agreement = await agreementService.getAgreementById(id);

      const html = templateService.generateHtmlPreview(agreement);

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buyer e-sign
   */
  signBuyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = ESignSchema.parse(req.body);
      const userId = (req as any).user?.id || 'system';

      const agreement = await agreementService.signBuyer(id, validatedData, userId);

      res.json({
        success: true,
        message: 'Agreement signed by buyer',
        data: { agreement }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Seller e-sign
   */
  signSeller = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = ESignSchema.parse(req.body);
      const userId = (req as any).user?.id || 'system';

      const agreement = await agreementService.signSeller(id, validatedData, userId);

      res.json({
        success: true,
        message: 'Agreement signed by seller',
        data: { agreement }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Witness e-sign
   */
  signWitness = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = ESignSchema.parse(req.body);
      const userId = (req as any).user?.id || 'system';
      const witnessNumber = parseInt(req.query.witness as string) || 1;

      const agreement = await agreementService.signWitness(
        id,
        validatedData,
        userId,
        witnessNumber as 1 | 2
      );

      res.json({
        success: true,
        message: `Agreement signed by witness ${witnessNumber}`,
        data: { agreement }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get signature status
   */
  getSignatureStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const status = await agreementService.getSignatureStatus(id);

      res.json({
        success: true,
        data: { status }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Submit for registration
   */
  submitForRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const agreement = await agreementService.submitForRegistration(id);

      res.json({
        success: true,
        message: 'Agreement submitted for registration',
        data: { agreement }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark as registered
   */
  markAsRegistered = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = RegisterAgreementSchema.parse(req.body);

      const agreement = await agreementService.markAsRegistered(id, validatedData);

      res.json({
        success: true,
        message: 'Agreement registered successfully',
        data: { agreement }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get registration status
   */
  getRegistrationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const status = await agreementService.getRegistrationStatus(id);

      res.json({
        success: true,
        data: { status }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add payment
   */
  addPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = AddPaymentSchema.parse(req.body);

      const agreement = await agreementService.addPayment(id, validatedData);

      res.json({
        success: true,
        message: 'Payment added to schedule',
        data: { agreement }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payment schedule
   */
  getPaymentSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const schedule = await agreementService.getPaymentSchedule(id);

      res.json({
        success: true,
        data: { schedule }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Confirm payment
   */
  confirmPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, paymentId } = req.params;
      const notes = req.body.notes;

      const agreement = await agreementService.confirmPayment(id, paymentId, notes);

      res.json({
        success: true,
        message: 'Payment confirmed',
        data: { agreement }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get statistics
   */
  getStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brokerId = req.query.brokerId as string;
      const stats = await agreementService.getStatistics(brokerId);

      res.json({
        success: true,
        data: { statistics: stats }
      });
    } catch (error) {
      next(error);
    }
  };
}

export const agreementController = new AgreementController();
export default agreementController;