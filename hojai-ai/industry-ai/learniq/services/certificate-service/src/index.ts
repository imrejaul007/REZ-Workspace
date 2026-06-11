/**
 * Certificate Service - Certificate Generation & Verification
 * Part of LEARNIQ - Education AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface Certificate {
  id: string;
  certificateId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  issueDate: string;
  expiryDate?: string;
  grade?: string;
  verificationCode: string;
  status: 'active' | 'expired' | 'revoked';
  pdfUrl?: string;
}

export class CertificateService {
  private certificates: Map<string, Certificate> = new Map();

  async create(data: Omit<Certificate, 'id' | 'certificateId' | 'verificationCode' | 'status'>): Promise<Certificate> {
    const certificateId = `CERT-${Date.now().toString(36).toUpperCase()}`;
    const verificationCode = uuidv4().substring(0, 8).toUpperCase();

    const certificate: Certificate = {
      ...data,
      id: uuidv4(),
      certificateId,
      verificationCode,
      status: 'active'
    };

    this.certificates.set(certificate.id, certificate);
    return certificate;
  }

  async getById(id: string): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }

  async getByVerificationCode(code: string): Promise<Certificate | undefined> {
    return Array.from(this.certificates.values())
      .find(c => c.verificationCode === code);
  }

  async getByStudent(studentId: string): Promise<Certificate[]> {
    return Array.from(this.certificates.values())
      .filter(c => c.studentId === studentId)
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }

  async verify(code: string): Promise<{
    valid: boolean;
    certificate?: Certificate;
    message: string;
  }> {
    const certificate = await this.getByVerificationCode(code);

    if (!certificate) {
      return { valid: false, message: 'Certificate not found' };
    }

    if (certificate.status === 'revoked') {
      return { valid: false, certificate, message: 'Certificate has been revoked' };
    }

    if (certificate.expiryDate && new Date(certificate.expiryDate) < new Date()) {
      certificate.status = 'expired';
      return { valid: false, certificate, message: 'Certificate has expired' };
    }

    return { valid: true, certificate, message: 'Certificate is valid' };
  }

  async revoke(certificateId: string, reason: string): Promise<boolean> {
    const certificate = Array.from(this.certificates.values())
      .find(c => c.certificateId === certificateId);

    if (!certificate) return false;

    certificate.status = 'revoked';
    this.certificates.set(certificate.id, certificate);
    return true;
  }

  async generatePdf(certificateId: string): Promise<string | null> {
    const certificate = Array.from(this.certificates.values())
      .find(c => c.certificateId === certificateId);

    if (!certificate) return null;

    // Simulate PDF generation
    const pdfUrl = `/certificates/${certificate.certificateId}.pdf`;
    certificate.pdfUrl = pdfUrl;
    this.certificates.set(certificate.id, certificate);

    return pdfUrl;
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
    thisMonth: number;
  }> {
    const all = Array.from(this.certificates.values());
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);

    return {
      total: all.length,
      active: all.filter(c => c.status === 'active').length,
      expired: all.filter(c => c.status === 'expired').length,
      revoked: all.filter(c => c.status === 'revoked').length,
      thisMonth: all.filter(c => new Date(c.issueDate) >= thisMonthStart).length
    };
  }
}

export default CertificateService;