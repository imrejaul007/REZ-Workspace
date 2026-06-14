import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async verifyAadhar(aadharNumber: string): Promise<{ isValid: boolean; data?: unknown }> {
    // Mock Aadhaar verification - replace with actual UIDAI API integration
    const isValid = this.validateAadharFormat(aadharNumber);
    
    if (!isValid) {
      return { isValid: false };
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response data
    const mockData = {
      name: 'John Doe',
      gender: 'M',
      dateOfBirth: '01-01-1990',
      address: '123 Main St, City, State, PIN',
    };

    return {
      isValid: true,
      data: mockData,
    };
  }

  async verifyPAN(panNumber: string): Promise<{ isValid: boolean; data?: unknown }> {
    const isValid = this.validatePANFormat(panNumber);
    
    if (!isValid) {
      return { isValid: false };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockData = {
      name: 'John Doe',
      category: 'Individual',
      status: 'Valid',
    };

    return {
      isValid: true,
      data: mockData,
    };
  }

  async createVerificationRequest(employeeId: string, documentType: string, documentData) {
    // Create document record for verification
    const document = await this.prisma.document.create({
      data: {
        employeeId,
        type: documentType,
        name: `${documentType} Verification`,
        url: documentData.url || '',
        verificationStatus: 'PENDING',
      },
    });

    return document;
  }

  async updateVerificationStatus(documentId: string, status: 'VERIFIED' | 'REJECTED', notes?: string) {
    // Update document verification status
    const document = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        verificationStatus: status,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        rejectionReason: status === 'REJECTED' ? notes : null,
      },
    });

    // Update employee verification status if Aadhaar is verified
    if (document.type === 'aadhar' && status === 'VERIFIED') {
      await this.prisma.employee.update({
        where: { id: document.employeeId },
        data: {
          aadharVerified: true,
          verifiedAt: new Date(),
        },
      });
    }

    return document;
  }

  private validateAadharFormat(aadhar: string): boolean {
    // Aadhaar should be 12 digits
    const pattern = /^\d{12}$/;
    return pattern.test(aadhar);
  }

  private validatePANFormat(pan: string): boolean {
    // PAN format: 5 letters, 4 digits, 1 letter
    const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return pattern.test(pan);
  }

  async getVerificationStats() {
    const [pendingCount, verifiedCount, rejectedCount] = await Promise.all([
      this.prisma.document.count({
        where: { verificationStatus: 'PENDING' },
      }),
      this.prisma.document.count({
        where: { verificationStatus: 'VERIFIED' },
      }),
      this.prisma.document.count({
        where: { verificationStatus: 'REJECTED' },
      }),
    ]);

    return {
      pending: pendingCount,
      verified: verifiedCount,
      rejected: rejectedCount,
      total: pendingCount + verifiedCount + rejectedCount,
    };
  }
}