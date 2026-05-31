/**
 * HR Recruiter Agent - Interview Scheduler Service
 * AI-powered interview scheduling with conflict resolution and feedback tracking
 */
import { InterviewSchedule, InterviewFeedback, InterviewType, Candidate, Job } from '../types';
interface InterviewSchedulerConfig {
    defaultDuration: number;
    bufferBetweenInterviews: number;
    reminder24hBefore: boolean;
    reminder1hBefore: boolean;
    workingHoursStart: string;
    workingHoursEnd: string;
    workingDays: number[];
}
interface TimeSlot {
    start: Date;
    end: Date;
    available: boolean;
}
export declare class InterviewScheduler {
    private config;
    private calendarEvents;
    constructor(config?: Partial<InterviewSchedulerConfig>);
    /**
     * Schedule an interview
     */
    scheduleInterview(candidate: Candidate, job: Job, input: {
        interviewType: InterviewType;
        roundNumber: number;
        scheduledAt: string;
        duration?: number;
        timezone?: string;
        location?: string;
        meetingLink?: string;
        interviewerIds: string[];
    }, createdBy?: string): InterviewSchedule;
    /**
     * Validate scheduled time
     */
    private validateScheduledTime;
    /**
     * Assign interviewers to an interview
     */
    private assignInterviewers;
    /**
     * Check for scheduling conflicts
     */
    private checkConflicts;
    /**
     * Add calendar events for interview
     */
    private addCalendarEvents;
    /**
     * Reschedule an interview
     */
    rescheduleInterview(interview: InterviewSchedule, newScheduledAt: string, newInterviewerIds?: string[]): InterviewSchedule;
    /**
     * Cancel an interview
     */
    cancelInterview(interview: InterviewSchedule, reason: string): InterviewSchedule;
    /**
     * Remove calendar events
     */
    private removeCalendarEvents;
    /**
     * Confirm an interview
     */
    confirmInterview(interview: InterviewSchedule): InterviewSchedule;
    /**
     * Mark interview as completed
     */
    completeInterview(interview: InterviewSchedule): InterviewSchedule;
    /**
     * Mark candidate as no-show
     */
    markNoShow(interview: InterviewSchedule): InterviewSchedule;
    /**
     * Submit interview feedback
     */
    submitFeedback(interview: InterviewSchedule, feedback: Omit<InterviewFeedback, 'submittedAt'>): InterviewFeedback;
    /**
     * Get interview summary
     */
    getInterviewSummary(interview: InterviewSchedule): {
        overallScore: number;
        recommendation: InterviewFeedback['recommendation'];
        completedBy: string;
        pendingBy: string[];
        strengths: string[];
        concerns: string[];
    };
    /**
     * Aggregate recommendations from multiple interviewers
     */
    private aggregateRecommendations;
    /**
     * Get top items from array
     */
    private getTopItems;
    /**
     * Find available time slots
     */
    findAvailableSlots(interviewerIds: string[], date: Date, duration: number, count?: number): TimeSlot[];
    /**
     * Check if a time slot is available for all interviewers
     */
    private checkSlotAvailability;
    /**
     * Create interview series for a job
     */
    createInterviewSeries(candidate: Candidate, job: Job, createdBy?: string): InterviewSchedule[];
    /**
     * Create interview series from rounds
     */
    private createInterviewSeriesFromRounds;
    /**
     * Get interview recommendations
     */
    getHiringRecommendation(interviews: InterviewSchedule[]): {
        recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire' | 'insufficient_data';
        confidence: number;
        summary: string;
    };
}
export declare const interviewScheduler: InterviewScheduler;
export {};
//# sourceMappingURL=interviewScheduler.d.ts.map