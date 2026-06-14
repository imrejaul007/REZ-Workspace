import { v4 as uuidv4 } from 'uuid';
import { Report, ReportSchema, Result, ResultSchema } from '../models/lab.js';
import { resultService } from './resultService.js';
import { testService } from './testService.js';

class ReportService {
  private reports: Map<string, Report> = new Map();

  createReport(data: {
    sampleId: string;
    patientId: string;
    orderedBy: string;
    tests: Array<{ testId: string; testName: string }>;
    pathologistId?: string;
    pathologistName?: string;
  }): Report {
    const now = new Date().toISOString();
    const report: Report = {
      reportId: `RPT-${uuidv4().slice(0, 8).toUpperCase()}`,
      sampleId: data.sampleId,
      patientId: data.patientId,
      orderedBy: data.orderedBy,
      tests: data.tests,
      results: [],
      interpretation: undefined,
      pathologistId: data.pathologistId,
      pathologistName: data.pathologistName,
      releasedAt: undefined,
      status: 'draft',
      pdfUrl: undefined,
      createdAt: now,
      updatedAt: now,
    };

    const validated = ReportSchema.parse(report);
    this.reports.set(validated.reportId, validated);
    return validated;
  }

  getReport(reportId: string): Report | undefined {
    return this.reports.get(reportId);
  }

  updateResults(
    reportId: string,
    results: Array<{
      parameterName: string;
      value: string | number;
      unit: string;
      referenceRange: { min: number; max: number };
      method?: string;
      instrument?: string;
      notes?: string;
    }>
  ): Report | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    // Add results for each test
    for (const test of report.tests) {
      const testResults = results.filter((r) =>
        testService.getTest(test.testId)?.parameters.some((p) => p.name === r.parameterName)
      );

      for (const resultData of testResults) {
        const result = resultService.addResult({
          testId: test.testId,
          parameterName: resultData.parameterName,
          value: resultData.value,
          unit: resultData.unit,
          referenceRange: resultData.referenceRange,
          method: resultData.method,
          instrument: resultData.instrument,
          notes: resultData.notes,
        });
        report.results.push(result);
      }
    }

    report.updatedAt = new Date().toISOString();
    return ReportSchema.parse(report);
  }

  addResult(reportId: string, result: Omit<Result, 'resultId'>): Report | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    const newResult: Result = {
      ...result,
      resultId: `RES-${uuidv4().slice(0, 8).toUpperCase()}`,
    };

    const validatedResult = ResultSchema.parse(newResult);
    report.results.push(validatedResult);
    report.updatedAt = new Date().toISOString();
    return ReportSchema.parse(report);
  }

  setInterpretation(reportId: string, interpretation: string): Report | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    report.interpretation = interpretation;
    report.updatedAt = new Date().toISOString();
    return ReportSchema.parse(report);
  }

  verifyReport(reportId: string, pathologistId: string, pathologistName: string): Report | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    report.status = 'verified';
    report.pathologistId = pathologistId;
    report.pathologistName = pathologistName;
    report.updatedAt = new Date().toISOString();
    return ReportSchema.parse(report);
  }

  releaseReport(reportId: string): Report | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    // Validate that report has results before releasing
    if (report.results.length === 0) {
      return null;
    }

    // Validate results
    const validation = resultService.validateResults(report.results);
    if (validation.criticalCount > 0) {
      // Critical results need explicit verification
      if (report.status !== 'verified') {
        return null;
      }
    }

    report.status = 'released';
    report.releasedAt = new Date().toISOString();
    report.updatedAt = new Date().toISOString();
    return ReportSchema.parse(report);
  }

  cancelReport(reportId: string): Report | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    report.status = 'cancelled';
    report.updatedAt = new Date().toISOString();
    return ReportSchema.parse(report);
  }

  getReportsByPatient(patientId: string): Report[] {
    return Array.from(this.reports.values())
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getReportsByDoctor(doctorId: string): Report[] {
    return Array.from(this.reports.values())
      .filter((r) => r.orderedBy === doctorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getReportsByStatus(status: Report['status']): Report[] {
    return Array.from(this.reports.values()).filter((r) => r.status === status);
  }

  getPendingReports(): Report[] {
    return this.getReportsByStatus('draft');
  }

  getReleasedReports(): Report[] {
    return this.getReportsByStatus('released');
  }

  getReportsWithCriticalResults(): Report[] {
    return Array.from(this.reports.values()).filter((r) =>
      r.results.some((res) => res.status === 'critical')
    );
  }

  setPdfUrl(reportId: string, pdfUrl: string): Report | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    report.pdfUrl = pdfUrl;
    report.updatedAt = new Date().toISOString();
    return ReportSchema.parse(report);
  }

  getReportCount(): { total: number; byStatus: Record<Report['status'], number> } {
    const reports = Array.from(this.reports.values());
    const byStatus: Record<Report['status'], number> = {
      draft: 0,
      verified: 0,
      released: 0,
      cancelled: 0,
    };

    reports.forEach((r) => {
      byStatus[r.status]++;
    });

    return { total: reports.length, byStatus };
  }

  generatePdfContent(report: Report): string {
    // Generate PDF content as a formatted string (actual PDF generation would use a library)
    let content = `
LABORATORY REPORT
=================

Report ID: ${report.reportId}
Date: ${new Date(report.createdAt).toLocaleDateString()}
${report.releasedAt ? `Released: ${new Date(report.releasedAt).toLocaleDateString()}` : ''}

Patient ID: ${report.patientId}
Ordered By: ${report.orderedBy}
Pathologist: ${report.pathologistName || 'N/A'}

TESTS PERFORMED
---------------
${report.tests.map((t) => `- ${t.testName}`).join('\n')}

RESULTS
-------
${report.results
  .map(
    (r) =>
      `${r.parameterName}: ${r.value} ${r.unit} (Ref: ${r.referenceRange.min}-${r.referenceRange.max}) [${r.status.toUpperCase()}]`
  )
  .join('\n')}

${report.interpretation ? `INTERPRETATION\n--------------\n${report.interpretation}` : ''}

---
This report is ${report.status.toUpperCase()}
`;
    return content;
  }
}

export const reportService = new ReportService();
