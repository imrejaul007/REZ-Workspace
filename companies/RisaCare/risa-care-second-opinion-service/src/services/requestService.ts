import { v4 as uuidv4 } from 'uuid';
import {
  SecondOpinionRequest,
  RequestStatus,
  ReportType,
  UrgencyLevel,
  MedicalHistory,
  UploadedReport,
  DataStore,
  CreateSecondOpinionRequestSchema
} from '../models/secondOpinion.js';

export class RequestService {
  private store: DataStore;

  constructor() {
    this.store = DataStore.getInstance();
  }

  async createRequest(data: {
    patientId: string;
    originalDiagnosis: string;
    medicalHistory: MedicalHistory[];
    condition: string;
    specialty: string;
    urgency?: UrgencyLevel;
    notes?: string;
  }): Promise<SecondOpinionRequest> {
    const validated = CreateSecondOpinionRequestSchema.parse(data);

    const request: SecondOpinionRequest = {
      requestId: `REQ-${uuidv4().substring(0, 8).toUpperCase()}`,
      patientId: validated.patientId,
      originalDiagnosis: validated.originalDiagnosis,
      medicalHistory: validated.medicalHistory,
      uploadedReports: [],
      condition: validated.condition,
      specialty: validated.specialty,
      urgency: validated.urgency || UrgencyLevel.ROUTINE,
      status: RequestStatus.PENDING,
      createdAt: new Date().toISOString(),
      notes: validated.notes
    };

    this.store.requests.set(request.requestId, request);
    return request;
  }

  async getRequest(requestId: string): Promise<SecondOpinionRequest | null> {
    return this.store.requests.get(requestId) || null;
  }

  async getPatientRequests(patientId: string): Promise<SecondOpinionRequest[]> {
    const requests: SecondOpinionRequest[] = [];
    this.store.requests.forEach(req => {
      if (req.patientId === patientId) {
        requests.push(req);
      }
    });
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    specialistId?: string
  ): Promise<SecondOpinionRequest | null> {
    const request = this.store.requests.get(requestId);
    if (!request) return null;

    request.status = status;
    if (specialistId) {
      request.assignedSpecialistId = specialistId;
    }
    if (status === RequestStatus.COMPLETED) {
      request.completedAt = new Date().toISOString();
    }

    this.store.requests.set(requestId, request);
    return request;
  }

  async uploadReport(
    requestId: string,
    report: {
      type: ReportType;
      title: string;
      fileUrl: string;
    }
  ): Promise<UploadedReport | null> {
    const request = this.store.requests.get(requestId);
    if (!request) return null;

    const uploadedReport: UploadedReport = {
      reportId: `RPT-${uuidv4().substring(0, 8).toUpperCase()}`,
      type: report.type,
      title: report.title,
      fileUrl: report.fileUrl,
      uploadedAt: new Date().toISOString()
    };

    request.uploadedReports.push(uploadedReport);
    this.store.requests.set(requestId, request);

    // Also store in medical reports
    this.store.medicalReports.set(uploadedReport.reportId, {
      reportId: uploadedReport.reportId,
      userId: request.patientId,
      type: report.type,
      title: report.title,
      summary: '',
      uploadedAt: uploadedReport.uploadedAt,
      fileUrl: report.fileUrl,
      analyzed: false
    });

    return uploadedReport;
  }

  async getReports(requestId: string): Promise<UploadedReport[]> {
    const request = this.store.requests.get(requestId);
    return request ? request.uploadedReports : [];
  }

  async getAllRequests(filters?: {
    status?: RequestStatus;
    specialty?: string;
    urgency?: UrgencyLevel;
  }): Promise<SecondOpinionRequest[]> {
    const requests: SecondOpinionRequest[] = [];
    this.store.requests.forEach(req => {
      if (filters) {
        if (filters.status && req.status !== filters.status) return;
        if (filters.specialty && req.specialty.toLowerCase() !== filters.specialty.toLowerCase()) return;
        if (filters.urgency && req.urgency !== filters.urgency) return;
      }
      requests.push(req);
    });
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async assignSpecialist(requestId: string, specialistId: string): Promise<SecondOpinionRequest | null> {
    const request = this.store.requests.get(requestId);
    if (!request) return null;

    request.assignedSpecialistId = specialistId;
    request.status = RequestStatus.MATCHED;
    this.store.requests.set(requestId, request);
    return request;
  }
}

export const requestService = new RequestService();
