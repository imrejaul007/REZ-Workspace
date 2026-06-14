import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverStatus } from '../models/driver.model';
import { NotificationService } from './notification.service';
import { DriverNotFoundError } from '../common/exceptions';

export interface ApprovalRequest {
  driverId: string;
  documents: {
    dl?: DocumentUpload;
    rc?: DocumentUpload;
    insurance?: DocumentUpload;
    permit?: DocumentUpload;
  };
}

export interface DocumentUpload {
  number: string;
  imageUrl: string;
  expiry?: Date;
}

export interface VerificationResult {
  success: boolean;
  status: 'approved' | 'pending' | 'rejected';
  message: string;
  approvedFields?: string[];
  rejectedFields?: string[];
}

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
    private notificationService: NotificationService,
  ) {}

  /**
   * Submit documents for verification
   */
  async submitDocuments(request: ApprovalRequest): Promise<{
    success: boolean;
    message: string;
    submittedAt: Date;
  }> {
    try {
      const driver = await this.driverModel.findById(request.driverId);

      if (!driver) {
        throw new DriverNotFoundError(request.driverId);
      }

      // Add/update documents
      const documents = request.documents;

      if (documents.dl) {
        const existingDl = driver.documents.find(d => d.type === 'dl');
        if (existingDl) {
          existingDl.number = documents.dl.number;
          existingDl.imageUrl = documents.dl.imageUrl;
          existingDl.expiry = documents.dl.expiry;
        } else {
          driver.documents.push({
            type: 'dl',
            number: documents.dl.number,
            imageUrl: documents.dl.imageUrl,
            verified: false,
            expiry: documents.dl.expiry,
          });
        }
      }

      if (documents.rc) {
        const existingRc = driver.documents.find(d => d.type === 'rc');
        if (existingRc) {
          existingRc.number = documents.rc.number;
          existingRc.imageUrl = documents.rc.imageUrl;
          existingRc.expiry = documents.rc.expiry;
        } else {
          driver.documents.push({
            type: 'rc',
            number: documents.rc.number,
            imageUrl: documents.rc.imageUrl,
            verified: false,
            expiry: documents.rc.expiry,
          });
        }
      }

      if (documents.insurance) {
        const existingIns = driver.documents.find(d => d.type === 'insurance');
        if (existingIns) {
          existingIns.number = documents.insurance.number;
          existingIns.imageUrl = documents.insurance.imageUrl;
          existingIns.expiry = documents.insurance.expiry;
        } else {
          driver.documents.push({
            type: 'insurance',
            number: documents.insurance.number,
            imageUrl: documents.insurance.imageUrl,
            verified: false,
            expiry: documents.insurance.expiry,
          });
        }
      }

      // Set status to pending verification if not already
      if (driver.status === DriverStatus.PENDING_VERIFICATION) {
        // Keep as pending
      }

      await driver.save();

      this.logger.log(`Documents submitted for driver ${request.driverId}`);

      // Notify admin (in production, send to admin queue)
      await this.notificationService.sendSMS(
        '+91XXXXXXXXXX', // Admin phone
        `New driver documents submitted: ${driver.name} (${driver.phone})`
      );

      return {
        success: true,
        message: 'Documents submitted successfully. You will be notified once verified.',
        submittedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Document submission failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify documents (admin action)
   */
  async verifyDocument(
    driverId: string,
    documentType: 'dl' | 'rc' | 'insurance' | 'permit',
    verified: boolean,
    adminNotes?: string
  ): Promise<VerificationResult> {
    try {
      const driver = await this.driverModel.findById(driverId);

      if (!driver) {
        throw new DriverNotFoundError(driverId);
      }

      const document = driver.documents.find(d => d.type === documentType);

      if (!document) {
        return {
          success: false,
          status: 'rejected',
          message: `${documentType.toUpperCase()} document not found`,
        };
      }

      document.verified = verified;
      document.verifiedAt = new Date();

      await driver.save();

      // Check if all required documents are verified
      const allVerified = this.checkAllDocumentsVerified(driver);

      if (allVerified) {
        driver.isDocumentsVerified = true;
        driver.status = DriverStatus.OFFLINE;
        await driver.save();

        // Notify driver
        await this.notificationService.sendSMS(
          driver.phone,
          'Congratulations! Your documents have been verified. You can now go online and start accepting rides.'
        );

        return {
          success: true,
          status: 'approved',
          message: 'All documents verified. Driver approved.',
        };
      } else {
        return {
          success: true,
          status: 'pending',
          message: `${documentType.toUpperCase()} ${verified ? 'verified' : 'rejected'}. Waiting for other documents.`,
        };
      }
    } catch (error) {
      this.logger.error(`Document verification failed: ${error.message}`);
      return {
        success: false,
        status: 'rejected',
        message: error.message,
      };
    }
  }

  /**
   * Approve driver (all documents verified)
   */
  async approveDriver(driverId: string, adminId: string): Promise<{
    success: boolean;
    driver: any;
  }> {
    try {
      const driver = await this.driverModel.findById(driverId);

      if (!driver) {
        throw new DriverNotFoundError(driverId);
      }

      // Verify all documents
      driver.documents.forEach(doc => {
        if (!doc.verified) {
          doc.verified = true;
          doc.verifiedAt = new Date();
        }
      });

      driver.isDocumentsVerified = true;
      driver.status = DriverStatus.OFFLINE;
      driver.isBackgroundChecked = true;

      await driver.save();

      // Send welcome notification
      await this.notificationService.sendSMS(
        driver.phone,
        `Welcome to ReZ Ride, ${driver.name}! Your account has been approved. Download the ReZ Driver app and start earning.`
      );

      this.logger.log(`Driver ${driverId} approved by admin ${adminId}`);

      return {
        success: true,
        driver,
      };
    } catch (error) {
      this.logger.error(`Driver approval failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reject driver
   */
  async rejectDriver(
    driverId: string,
    adminId: string,
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const driver = await this.driverModel.findById(driverId);

      if (!driver) {
        throw new DriverNotFoundError(driverId);
      }

      driver.status = DriverStatus.SUSPENDED;
      driver.isDocumentsVerified = false;

      await driver.save();

      // Notify driver
      await this.notificationService.sendSMS(
        driver.phone,
        `Your ReZ Ride application has been rejected. Reason: ${reason}. Please contact support for more information.`
      );

      this.logger.log(`Driver ${driverId} rejected by admin ${adminId}: ${reason}`);

      return {
        success: true,
        message: 'Driver rejected and notified',
      };
    } catch (error) {
      this.logger.error(`Driver rejection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pending approval requests
   */
  async getPendingApprovals(): Promise<any[]> {
    const pendingDrivers = await this.driverModel.find({
      status: DriverStatus.PENDING_VERIFICATION,
    }).select('name phone vehicle documents createdAt');

    return pendingDrivers.map(driver => ({
      id: driver._id,
      name: driver.name,
      phone: driver.phone,
      vehicle: driver.vehicle,
      documentsSubmitted: driver.documents.length,
      documentsVerified: driver.documents.filter(d => d.verified).length,
      submittedAt: driver.createdAt,
    }));
  }

  /**
   * Check if all required documents are verified
   */
  private checkAllDocumentsVerified(driver: Driver): boolean {
    const requiredTypes = ['dl', 'rc']; // Minimum required

    return requiredTypes.every(type => {
      const doc = driver.documents.find(d => d.type === type);
      return doc && doc.verified;
    });
  }

  /**
   * Check document expiry
   */
  async checkExpiringDocuments(): Promise<any[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringDocuments = await this.driverModel.find({
      'documents.expiry': {
        $lte: thirtyDaysFromNow,
        $gte: new Date(),
      },
    }).select('name phone documents');

    return expiringDocuments.map(driver => {
      const expiring = driver.documents.filter(doc =>
        doc.expiry && doc.expiry <= thirtyDaysFromNow && doc.expiry >= new Date()
      );

      return {
        driverId: driver._id,
        name: driver.name,
        phone: driver.phone,
        expiringDocuments: expiring.map(d => ({
          type: d.type,
          expiry: d.expiry,
        })),
      };
    });
  }
}
