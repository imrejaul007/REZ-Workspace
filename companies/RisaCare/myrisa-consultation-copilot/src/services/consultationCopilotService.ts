import { v4 as uuidv4 } from 'uuid';
import {
  Consultation,
  ConsultationBrief,
  ConsultationStatus,
  ConsultationType,
  FollowUpTask,
  PostVisitNotes,
  PreVisitSummary,
  Question,
  QuestionSchema,
  ReminderStatus,
  ScheduleConsultationRequest,
  RecordPostVisitRequest,
  CreateFollowUpTasksRequest,
  GenerateQuestionsRequest,
  TaskStatus,
  Medication,
  ConsultationBriefSchema,
} from '../models/consultationCopilot.js';

// ==================== IN-MEMORY STORAGE ====================

class Storage {
  consultations: Map<string, Consultation> = new Map();
  preVisitSummaries: Map<string, PreVisitSummary> = new Map();
  postVisitNotes: Map<string, PostVisitNotes> = new Map();
  followUpTasks: Map<string, FollowUpTask> = new Map();
  questions: Map<string, Question> = new Map();

  // Indexes for efficient queries
  consultationsByUser: Map<string, string[]> = new Map();
  preVisitByConsultation: Map<string, string> = new Map();
  postVisitByConsultation: Map<string, string> = new Map();
  followUpsByConsultation: Map<string, string[]> = new Map();
  questionsByConsultation: Map<string, string[]> = new Map();
}

const storage = new Storage();

// ==================== SERVICE CLASS ====================

export class ConsultationCopilotService {
  /**
   * Schedule a new consultation/appointment
   */
  async scheduleConsultation(
    userId: string,
    data: ScheduleConsultationRequest
  ): Promise<Consultation> {
    const now = new Date().toISOString();

    const consultation: Consultation = {
      id: uuidv4(),
      userId,
      doctorName: data.doctorName,
      doctorSpecialty: data.doctorSpecialty,
      doctorContact: data.doctorContact,
      consultationType: data.consultationType,
      status: ConsultationStatus.SCHEDULED,
      scheduledDate: data.scheduledDate,
      duration: data.duration ?? 30,
      reason: data.reason,
      notes: data.notes,
      location: data.location,
      createdAt: now,
      updatedAt: now,
    };

    // Store consultation
    storage.consultations.set(consultation.id, consultation);

    // Update user index
    if (!storage.consultationsByUser.has(userId)) {
      storage.consultationsByUser.set(userId, []);
    }
    storage.consultationsByUser.get(userId)!.push(consultation.id);

    return consultation;
  }

  /**
   * Generate a pre-visit summary from health memory
   * In production, this would integrate with HOJAI Memory (4520) and Genie Memory (4703)
   */
  async generatePreVisitSummary(
    userId: string,
    consultationId: string
  ): Promise<PreVisitSummary> {
    const consultation = storage.consultations.get(consultationId);
    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (consultation.userId !== userId) {
      throw new Error('Unauthorized access to consultation');
    }

    const now = new Date().toISOString();

    // In production: fetch from HOJAI Memory (4520) and Genie Memory (4703)
    // For now, generate a template summary
    const preVisitSummary: PreVisitSummary = {
      id: uuidv4(),
      consultationId,
      userId,
      chiefComplaint: consultation.reason,
      symptoms: [],
      currentMedications: [],
      relevantHistory: [],
      allergies: [],
      vitalReadings: undefined,
      questionsToAsk: [],
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Store pre-visit summary
    storage.preVisitSummaries.set(preVisitSummary.id, preVisitSummary);
    storage.preVisitByConsultation.set(consultationId, preVisitSummary.id);

    return preVisitSummary;
  }

  /**
   * Generate intelligent questions to ask the doctor
   * In production, this would use HOJAI AI for personalized questions
   */
  async generateQuestions(
    userId: string,
    consultationId: string,
    options?: GenerateQuestionsRequest
  ): Promise<Question[]> {
    const consultation = storage.consultations.get(consultationId);
    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (consultation.userId !== userId) {
      throw new Error('Unauthorized access to consultation');
    }

    // Default questions based on consultation type
    const defaultQuestions = this.getDefaultQuestions(consultation.consultationType, options?.focusAreas ?? []);
    const now = new Date().toISOString();

    const questions: Question[] = defaultQuestions.map((q, index) => ({
      id: uuidv4(),
      consultationId,
      userId,
      question: q.text,
      category: q.category,
      priority: q.priority,
      isAsked: false,
      answer: undefined,
      notes: undefined,
      createdAt: now,
      updatedAt: now,
    }));

    // Store questions
    for (const question of questions) {
      storage.questions.set(question.id, question);
    }

    // Update consultation index
    if (!storage.questionsByConsultation.has(consultationId)) {
      storage.questionsByConsultation.set(consultationId, []);
    }
    storage.questionsByConsultation.get(consultationId)!.push(...questions.map(q => q.id));

    return questions;
  }

  /**
   * Record post-visit notes after a consultation
   */
  async recordPostVisit(
    userId: string,
    consultationId: string,
    data: RecordPostVisitRequest
  ): Promise<PostVisitNotes> {
    const consultation = storage.consultations.get(consultationId);
    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (consultation.userId !== userId) {
      throw new Error('Unauthorized access to consultation');
    }

    const now = new Date().toISOString();

    const postVisitNotes: PostVisitNotes = {
      id: uuidv4(),
      consultationId,
      userId,
      diagnosis: data.diagnosis,
      diagnosisIcd10: data.diagnosisIcd10,
      notes: data.notes,
      prescriptions: data.prescriptions.map(p => ({
        ...p,
        id: uuidv4(),
        isActive: true,
      })),
      labOrders: data.labOrders,
      imagingOrders: data.imagingOrders,
      instructions: data.instructions,
      nextVisitRecommendation: data.nextVisitRecommendation,
      nextVisitTimeframe: data.nextVisitTimeframe,
      doctorNotes: data.doctorNotes,
      patientUnderstanding: data.patientUnderstanding,
      createdAt: now,
      updatedAt: now,
    };

    // Store post-visit notes
    storage.postVisitNotes.set(postVisitNotes.id, postVisitNotes);
    storage.postVisitByConsultation.set(consultationId, postVisitNotes.id);

    // Update consultation status
    consultation.status = ConsultationStatus.COMPLETED;
    consultation.updatedAt = now;

    return postVisitNotes;
  }

  /**
   * Create follow-up tasks after a consultation
   */
  async createFollowUpTasks(
    userId: string,
    consultationId: string,
    data: CreateFollowUpTasksRequest
  ): Promise<FollowUpTask[]> {
    const consultation = storage.consultations.get(consultationId);
    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (consultation.userId !== userId) {
      throw new Error('Unauthorized access to consultation');
    }

    const now = new Date().toISOString();
    const tasks: FollowUpTask[] = [];

    for (const taskData of data.tasks) {
      const task: FollowUpTask = {
        id: uuidv4(),
        consultationId,
        userId,
        taskType: taskData.taskType,
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        status: TaskStatus.PENDING,
        priority: taskData.priority,
        reminder: taskData.reminderEnabled ? {
          enabled: true,
          remindAt: taskData.reminderTime,
          status: ReminderStatus.PENDING,
        } : undefined,
        metadata: taskData.metadata,
        completedAt: undefined,
        createdAt: now,
        updatedAt: now,
      };

      storage.followUpTasks.set(task.id, task);
      tasks.push(task);

      // Update consultation index
      if (!storage.followUpsByConsultation.has(consultationId)) {
        storage.followUpsByConsultation.set(consultationId, []);
      }
      storage.followUpsByConsultation.get(consultationId)!.push(task.id);
    }

    return tasks;
  }

  /**
   * Get all upcoming consultations for a user
   */
  async getUpcomingConsultations(userId: string): Promise<Consultation[]> {
    const consultationIds = storage.consultationsByUser.get(userId) ?? [];
    const now = new Date();

    const upcoming = consultationIds
      .map(id => storage.consultations.get(id))
      .filter((c): c is Consultation => {
        if (!c) return false;
        const scheduledDate = new Date(c.scheduledDate);
        return (
          scheduledDate >= now &&
          (c.status === ConsultationStatus.SCHEDULED || c.status === ConsultationStatus.IN_PROGRESS)
        );
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    return upcoming;
  }

  /**
   * Get consultation history (past visits) for a user
   */
  async getConsultationHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ consultations: Consultation[]; total: number }> {
    const consultationIds = storage.consultationsByUser.get(userId) ?? [];
    const now = new Date();

    const past = consultationIds
      .map(id => storage.consultations.get(id))
      .filter((c): c is Consultation => {
        if (!c) return false;
        const scheduledDate = new Date(c.scheduledDate);
        return scheduledDate < now || c.status === ConsultationStatus.COMPLETED;
      })
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

    return {
      consultations: past.slice(offset, offset + limit),
      total: past.length,
    };
  }

  /**
   * Generate a complete consultation brief
   */
  async generateConsultationBrief(
    userId: string,
    consultationId: string
  ): Promise<ConsultationBrief> {
    const consultation = storage.consultations.get(consultationId);
    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (consultation.userId !== userId) {
      throw new Error('Unauthorized access to consultation');
    }

    // Get pre-visit summary
    const preVisitSummaryId = storage.preVisitByConsultation.get(consultationId);
    const preVisitSummary = preVisitSummaryId
      ? storage.preVisitSummaries.get(preVisitSummaryId)
      : undefined;

    // Get post-visit notes
    const postVisitNotesId = storage.postVisitByConsultation.get(consultationId);
    const postVisitNotes = postVisitNotesId
      ? storage.postVisitNotes.get(postVisitNotesId)
      : undefined;

    // Get follow-up tasks
    const followUpTaskIds = storage.followUpsByConsultation.get(consultationId) ?? [];
    const followUpTasks = followUpTaskIds
      .map(id => storage.followUpTasks.get(id))
      .filter((t): t is FollowUpTask => t !== undefined);

    // Get questions
    const questionIds = storage.questionsByConsultation.get(consultationId) ?? [];
    const questions = questionIds
      .map(id => storage.questions.get(id))
      .filter((q): q is Question => q !== undefined);

    return {
      consultation,
      preVisitSummary,
      postVisitNotes,
      followUpTasks,
      questions,
    };
  }

  /**
   * Update question (mark as asked, add answer)
   */
  async updateQuestion(
    userId: string,
    questionId: string,
    updates: { isAsked?: boolean; answer?: string; notes?: string }
  ): Promise<Question> {
    const question = storage.questions.get(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    if (question.userId !== userId) {
      throw new Error('Unauthorized access to question');
    }

    const updatedQuestion: Question = {
      ...question,
      isAsked: updates.isAsked ?? question.isAsked,
      answer: updates.answer ?? question.answer,
      notes: updates.notes ?? question.notes,
      updatedAt: new Date().toISOString(),
    };

    storage.questions.set(questionId, updatedQuestion);
    return updatedQuestion;
  }

  /**
   * Update follow-up task status
   */
  async updateFollowUpTask(
    userId: string,
    taskId: string,
    updates: { status?: TaskStatus; completedAt?: string }
  ): Promise<FollowUpTask> {
    const task = storage.followUpTasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.userId !== userId) {
      throw new Error('Unauthorized access to task');
    }

    const updatedTask: FollowUpTask = {
      ...task,
      status: updates.status ?? task.status,
      completedAt: updates.completedAt ?? task.completedAt,
      updatedAt: new Date().toISOString(),
    };

    // Check if overdue
    if (updatedTask.status === TaskStatus.PENDING) {
      const now = new Date();
      const dueDate = new Date(updatedTask.dueDate);
      if (dueDate < now) {
        updatedTask.status = TaskStatus.OVERDUE;
      }
    }

    storage.followUpTasks.set(taskId, updatedTask);
    return updatedTask;
  }

  /**
   * Cancel a consultation
   */
  async cancelConsultation(userId: string, consultationId: string): Promise<Consultation> {
    const consultation = storage.consultations.get(consultationId);
    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (consultation.userId !== userId) {
      throw new Error('Unauthorized access to consultation');
    }

    consultation.status = ConsultationStatus.CANCELLED;
    consultation.updatedAt = new Date().toISOString();

    return consultation;
  }

  /**
   * Get follow-up tasks for a user
   */
  async getFollowUpTasks(
    userId: string,
    options?: { status?: TaskStatus; upcoming?: boolean }
  ): Promise<FollowUpTask[]> {
    const allTasks: FollowUpTask[] = [];

    for (const [id, task] of storage.followUpTasks) {
      if (task.userId === userId) {
        if (options?.status && task.status !== options.status) continue;
        if (options?.upcoming) {
          const now = new Date();
          const dueDate = new Date(task.dueDate);
          if (dueDate < now) continue;
        }
        allTasks.push(task);
      }
    }

    return allTasks.sort((a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  /**
   * Helper: Get default questions based on consultation type
   */
  private getDefaultQuestions(
    type: ConsultationType,
    focusAreas: string[]
  ): Array<{ text: string; category: Question['category']; priority: 'high' | 'medium' | 'low' }> {
    const baseQuestions: Array<{ text: string; category: Question['category']; priority: 'high' | 'medium' | 'low' }> = [
      { text: 'What is my diagnosis?', category: 'diagnosis', priority: 'high' },
      { text: 'What are the treatment options?', category: 'treatment', priority: 'high' },
      { text: 'Are there any side effects I should watch for?', category: 'side_effects', priority: 'high' },
      { text: 'When should I expect to feel better?', category: 'treatment', priority: 'medium' },
      { text: 'Do I need any follow-up tests?', category: 'follow_up', priority: 'medium' },
    ];

    const typeSpecificQuestions: Record<ConsultationType, Array<{ text: string; category: Question['category']; priority: 'high' | 'medium' | 'low' }>> = {
      [ConsultationType.GENERAL]: [
        { text: 'Should I make any lifestyle changes?', category: 'lifestyle', priority: 'medium' },
        { text: 'How often should I schedule check-ups?', category: 'follow_up', priority: 'low' },
      ],
      [ConsultationType.SPECIALIST]: [
        { text: 'How does this relate to my other conditions?', category: 'diagnosis', priority: 'medium' },
        { text: 'Will I need ongoing specialist care?', category: 'follow_up', priority: 'medium' },
      ],
      [ConsultationType.FOLLOW_UP]: [
        { text: 'Is my condition improving as expected?', category: 'symptoms', priority: 'high' },
        { text: 'Should I continue the current treatment plan?', category: 'treatment', priority: 'high' },
      ],
      [ConsultationType.TELEMEDICINE]: [
        { text: 'Do I need an in-person visit for any tests?', category: 'follow_up', priority: 'medium' },
        { text: 'What symptoms require urgent care?', category: 'symptoms', priority: 'high' },
      ],
      [ConsultationType.EMERGENCY]: [
        { text: 'What warning signs should I watch for at home?', category: 'symptoms', priority: 'high' },
        { text: 'When should I seek emergency care?', category: 'symptoms', priority: 'high' },
      ],
      [ConsultationType.WELLNESS]: [
        { text: 'What preventive screenings do I need?', category: 'follow_up', priority: 'medium' },
        { text: 'Are there vaccinations I should consider?', category: 'treatment', priority: 'low' },
      ],
    };

    // Add focus area questions
    const focusQuestions: Array<{ text: string; category: Question['category']; priority: 'high' | 'medium' | 'low' }> = [];
    for (const area of focusAreas) {
      focusQuestions.push({
        text: `Can you tell me more about ${area}?`,
        category: 'other',
        priority: 'medium',
      });
    }

    return [
      ...baseQuestions,
      ...(typeSpecificQuestions[type] ?? []),
      ...focusQuestions,
    ];
  }
}

// Export singleton instance
export const consultationCopilotService = new ConsultationCopilotService();
