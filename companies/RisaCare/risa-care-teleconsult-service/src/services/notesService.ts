import {
  db,
  ConsultationNote,
  SaveNotesRequest,
} from '../models/teleconsult.js';

export class NotesService {
  /**
   * Save consultation notes
   */
  async saveNotes(sessionId: string, request: SaveNotesRequest): Promise<ConsultationNote> {
    // Verify session exists
    const session = db.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const now = new Date().toISOString();

    // Check if notes already exist
    const existing = db.notes.get(sessionId);

    const notes: ConsultationNote = {
      sessionId,
      doctorId: request.doctorId,
      subjective: request.subjective,
      objective: request.objective,
      assessment: request.assessment,
      plan: request.plan,
      prescriptions: request.prescriptions,
      labOrders: request.labOrders,
      followUp: request.followUp,
      icdCodes: request.icdCodes,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    db.notes.set(sessionId, notes);

    return notes;
  }

  /**
   * Get consultation notes
   */
  getNotes(sessionId: string): ConsultationNote | undefined {
    return db.notes.get(sessionId);
  }

  /**
   * Update existing notes
   */
  async updateNotes(
    sessionId: string,
    updates: Partial<Omit<ConsultationNote, 'sessionId' | 'createdAt'>>
  ): Promise<ConsultationNote> {
    const notes = db.notes.get(sessionId);
    if (!notes) {
      throw new Error(`Notes not found for session: ${sessionId}`);
    }

    const now = new Date().toISOString();

    const updated: ConsultationNote = {
      ...notes,
      ...updates,
      updatedAt: now,
    };

    db.notes.set(sessionId, updated);

    return updated;
  }

  /**
   * Delete notes
   */
  async deleteNotes(sessionId: string): Promise<boolean> {
    return db.notes.delete(sessionId);
  }

  /**
   * Get notes for a patient
   */
  getPatientNotes(patientId: string): ConsultationNote[] {
    const notes: ConsultationNote[] = [];

    db.sessions.forEach(session => {
      if (session.patientId === patientId) {
        const patientNotes = db.notes.get(session.sessionId);
        if (patientNotes) {
          notes.push({
            ...patientNotes,
            // Include session info for context
          } as ConsultationNote & { scheduledAt?: string; doctorId?: string });
        }
      }
    });

    return notes.sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  /**
   * Get notes for a doctor
   */
  getDoctorNotes(doctorId: string): ConsultationNote[] {
    const notes: ConsultationNote[] = [];

    db.notes.forEach(note => {
      if (note.doctorId === doctorId) {
        notes.push(note);
      }
    });

    return notes.sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  /**
   * Get notes with session context
   */
  getNotesWithContext(sessionId: string): {
    notes: ConsultationNote | undefined;
    session: typeof db.sessions extends Map<string, infer T> ? T : never;
  } | null {
    const session = db.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const notes = db.notes.get(sessionId);

    return { notes, session };
  }

  /**
   * Generate SOAP note format
   */
  generateSoapNote(sessionId: string): {
    sessionId: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    formatted: string;
  } | null {
    const notes = db.notes.get(sessionId);
    if (!notes) {
      return null;
    }

    const soapNote = {
      sessionId,
      subjective: notes.subjective || '',
      objective: notes.objective || '',
      assessment: notes.assessment || '',
      plan: notes.plan || '',
      formatted: `
SUBJECTIVE:
${notes.subjective || 'N/A'}

OBJECTIVE:
${notes.objective || 'N/A'}

ASSESSMENT:
${notes.assessment || 'N/A'}

PLAN:
${notes.plan || 'N/A'}
      `.trim(),
    };

    return soapNote;
  }

  /**
   * Validate notes completeness
   */
  validateNotes(notes: ConsultationNote): {
    complete: boolean;
    missingFields: string[];
    warnings: string[];
  } {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    if (!notes.subjective) missingFields.push('Subjective');
    if (!notes.objective) missingFields.push('Objective');
    if (!notes.assessment) missingFields.push('Assessment');
    if (!notes.plan) missingFields.push('Plan');

    // Warnings for best practices
    if (notes.icdCodes && notes.icdCodes.length === 0) {
      warnings.push('No ICD codes specified');
    }

    if (!notes.followUp?.recommended && !notes.followUp?.notes) {
      warnings.push('No follow-up information specified');
    }

    return {
      complete: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }

  /**
   * Get notes summary statistics
   */
  getNotesStatistics(): {
    totalNotes: number;
    notesWithPrescriptions: number;
    notesWithLabOrders: number;
    notesWithFollowUp: number;
    averageWordCount: number;
  } {
    let notesWithPrescriptions = 0;
    let notesWithLabOrders = 0;
    let notesWithFollowUp = 0;
    let totalWordCount = 0;

    db.notes.forEach(notes => {
      if (notes.prescriptions && notes.prescriptions.length > 0) {
        notesWithPrescriptions++;
      }
      if (notes.labOrders && notes.labOrders.length > 0) {
        notesWithLabOrders++;
      }
      if (notes.followUp?.recommended) {
        notesWithFollowUp++;
      }

      // Count words
      const content = [
        notes.subjective,
        notes.objective,
        notes.assessment,
        notes.plan,
      ].filter(Boolean).join(' ');
      totalWordCount += content.split(/\s+/).length;
    });

    const totalNotes = db.notes.size;

    return {
      totalNotes,
      notesWithPrescriptions,
      notesWithLabOrders,
      notesWithFollowUp,
      averageWordCount: totalNotes > 0 ? Math.round(totalWordCount / totalNotes) : 0,
    };
  }
}

export const notesService = new NotesService();
