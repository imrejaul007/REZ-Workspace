import { v4 as uuidv4 } from 'uuid';
import { Sample, SampleSchema, SampleStatus } from '../models/lab.js';

class SampleService {
  private samples: Map<string, Sample> = new Map();
  private barcodeIndex: Map<string, string> = new Map(); // barcode -> sampleId

  collectSample(data: {
    patientId: string;
    testIds: string[];
    collectedBy: string;
    containerType: string;
    volume?: string;
    priority?: 'routine' | 'urgent' | 'stat';
    notes?: string;
  }): Sample {
    const sample: Sample = {
      sampleId: `SAM-${uuidv4().slice(0, 8).toUpperCase()}`,
      patientId: data.patientId,
      testIds: data.testIds,
      collectedAt: new Date().toISOString(),
      collectedBy: data.collectedBy,
      receivedAt: undefined,
      receivedBy: undefined,
      status: 'collected',
      containerType: data.containerType,
      volume: data.volume,
      barcode: `BC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      notes: data.notes,
      priority: data.priority ?? 'routine',
    };

    const validated = SampleSchema.parse(sample);
    this.samples.set(validated.sampleId, validated);
    this.barcodeIndex.set(validated.barcode!, validated.sampleId);
    return validated;
  }

  receiveSample(sampleId: string, receivedBy: string): Sample | null {
    const sample = this.samples.get(sampleId);
    if (!sample) return null;

    const now = new Date().toISOString();
    sample.receivedAt = now;
    sample.receivedBy = receivedBy;
    sample.status = 'received';

    return SampleSchema.parse(sample);
  }

  updateSampleStatus(sampleId: string, status: SampleStatus): Sample | null {
    const sample = this.samples.get(sampleId);
    if (!sample) return null;

    sample.status = status;
    return SampleSchema.parse(sample);
  }

  getSample(sampleId: string): Sample | undefined {
    return this.samples.get(sampleId);
  }

  getSampleByBarcode(barcode: string): Sample | undefined {
    const sampleId = this.barcodeIndex.get(barcode);
    if (!sampleId) return undefined;
    return this.samples.get(sampleId);
  }

  trackSample(sampleId: string): {
    sample: Sample | undefined;
    history: Array<{ status: SampleStatus; timestamp: string }>;
  } | null {
    const sample = this.samples.get(sampleId);
    if (!sample) return null;

    const history: Array<{ status: SampleStatus; timestamp: string }> = [
      { status: 'collected', timestamp: sample.collectedAt },
    ];

    if (sample.receivedAt) {
      history.push({ status: 'received', timestamp: sample.receivedAt });
    }

    if (sample.status === 'processing') {
      history.push({ status: 'processing', timestamp: new Date().toISOString() });
    }

    if (sample.status === 'completed') {
      history.push({ status: 'completed', timestamp: new Date().toISOString() });
    }

    return { sample, history };
  }

  getSampleStatus(sampleId: string): { status: SampleStatus; details?: Sample } | null {
    const sample = this.samples.get(sampleId);
    if (!sample) return null;
    return { status: sample.status, details: sample };
  }

  getSamplesByPatient(patientId: string): Sample[] {
    return Array.from(this.samples.values()).filter((s) => s.patientId === patientId);
  }

  getSamplesByStatus(status: SampleStatus): Sample[] {
    return Array.from(this.samples.values()).filter((s) => s.status === status);
  }

  getPendingSamples(): Sample[] {
    return Array.from(this.samples.values()).filter(
      (s) => s.status === 'collected' || s.status === 'in_transit'
    );
  }

  getUrgentSamples(): Sample[] {
    return Array.from(this.samples.values()).filter(
      (s) => s.priority === 'urgent' || s.priority === 'stat'
    );
  }

  updateSampleNotes(sampleId: string, notes: string): Sample | null {
    const sample = this.samples.get(sampleId);
    if (!sample) return null;

    sample.notes = notes;
    return SampleSchema.parse(sample);
  }

  markInTransit(sampleId: string): Sample | null {
    const sample = this.samples.get(sampleId);
    if (!sample) return null;

    if (sample.status !== 'collected') return null;
    sample.status = 'in_transit';
    return SampleSchema.parse(sample);
  }

  markProcessing(sampleId: string): Sample | null {
    const sample = this.samples.get(sampleId);
    if (!sample) return null;

    if (sample.status !== 'received') return null;
    sample.status = 'processing';
    return SampleSchema.parse(sample);
  }

  markCompleted(sampleId: string): Sample | null {
    const sample = this.samples.get(sampleId);
    if (!sample) return null;

    sample.status = 'completed';
    return SampleSchema.parse(sample);
  }

  getSampleCount(): { total: number; byStatus: Record<SampleStatus, number> } {
    const samples = Array.from(this.samples.values());
    const byStatus: Record<SampleStatus, number> = {
      collected: 0,
      in_transit: 0,
      received: 0,
      processing: 0,
      completed: 0,
    };

    samples.forEach((s) => {
      byStatus[s.status]++;
    });

    return { total: samples.length, byStatus };
  }
}

export const sampleService = new SampleService();
