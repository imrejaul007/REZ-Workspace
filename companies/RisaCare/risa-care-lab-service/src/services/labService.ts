import { v4 as uuidv4 } from 'uuid';
import { Lab, LabSchema, CollectionCenter, CollectionCenterSchema } from '../models/lab.js';

class LabService {
  private lab: Lab | null = null;
  private collectionCenters: Map<string, CollectionCenter> = new Map();

  setupLab(data: Omit<Lab, 'labId' | 'createdAt' | 'updatedAt'>): Lab {
    const now = new Date().toISOString();
    const lab: Lab = {
      ...data,
      labId: `LAB-${uuidv4().slice(0, 8).toUpperCase()}`,
      createdAt: now,
      updatedAt: now,
    };

    const validated = LabSchema.parse(lab);
    this.lab = validated;
    return validated;
  }

  getLab(): Lab | null {
    return this.lab;
  }

  updateLab(updates: Partial<Omit<Lab, 'labId' | 'createdAt'>>): Lab | null {
    if (!this.lab) return null;

    const updatedLab = {
      ...this.lab,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.lab = LabSchema.parse(updatedLab);
    return this.lab;
  }

  addCollectionCenter(data: Omit<CollectionCenter, 'centerId'>): CollectionCenter {
    const center: CollectionCenter = {
      ...data,
      centerId: `CC-${uuidv4().slice(0, 8).toUpperCase()}`,
    };

    const validated = CollectionCenterSchema.parse(center);
    this.collectionCenters.set(validated.centerId, validated);

    // Update lab's collection centers
    if (this.lab) {
      this.lab.collectionCenters.push(validated.centerId);
      this.lab.updatedAt = new Date().toISOString();
    }

    return validated;
  }

  getCollectionCenter(centerId: string): CollectionCenter | undefined {
    return this.collectionCenters.get(centerId);
  }

  getAllCollectionCenters(): CollectionCenter[] {
    return Array.from(this.collectionCenters.values());
  }

  updateCollectionCenter(centerId: string, updates: Partial<CollectionCenter>): CollectionCenter | null {
    const existing = this.collectionCenters.get(centerId);
    if (!existing) return null;

    const updated = CollectionCenterSchema.parse({
      ...existing,
      ...updates,
      centerId, // preserve original ID
    });

    this.collectionCenters.set(centerId, updated);
    return updated;
  }

  addCertification(certification: string): boolean {
    if (!this.lab) return false;
    if (!this.lab.certifications.includes(certification)) {
      this.lab.certifications.push(certification);
      this.lab.updatedAt = new Date().toISOString();
    }
    return true;
  }

  addAccreditation(accreditation: string): boolean {
    if (!this.lab) return false;
    if (!this.lab.accreditations.includes(accreditation)) {
      this.lab.accreditations.push(accreditation);
      this.lab.updatedAt = new Date().toISOString();
    }
    return true;
  }
}

export const labService = new LabService();
