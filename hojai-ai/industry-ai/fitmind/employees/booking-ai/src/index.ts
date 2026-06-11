/**
 * Booking AI - Class Booking & PT Sessions Agent
 * Part of FITMIND - Fitness AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export type ClassType = 'yoga' | 'hiit' | 'strength' | 'cardio' | 'dance' | 'spinning' | 'pilates' | 'zumba' | 'crossfit' | 'bootcamp';
export type BookingStatus = 'confirmed' | 'waitlisted' | 'cancelled' | 'completed' | 'no-show';
export type TrainerSpecialty = 'weightlifting' | 'yoga' | 'hiit' | 'cardio' | 'nutrition' | 'rehabilitation';

export interface Trainer {
  id: string;
  name: string;
  specialties: TrainerSpecialty[];
  rating: number;
  experience: number;
  certifications: string[];
  available: boolean;
  classes: string[];
  memberReviews: { memberName: string; rating: number; comment: string }[];
}

export interface GymClass {
  id: string;
  name: string;
  type: ClassType;
  instructor: string;
  instructorId: string;
  schedule: string;
  duration: number;
  capacity: number;
  enrolled: number;
  waitlist: string[];
  room: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  description: string;
}

export interface PTSession {
  id: string;
  memberId: string;
  memberName: string;
  trainerId: string;
  trainerName: string;
  date: string;
  time: string;
  duration: number;
  focus: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  workoutPlan?: string;
}

export interface Booking {
  id: string;
  memberId: string;
  memberName: string;
  type: 'class' | 'pt-session';
  classId?: string;
  className?: string;
  ptSessionId?: string;
  date: string;
  time: string;
  status: BookingStatus;
  bookedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface BookingRequest {
  memberId: string;
  memberName: string;
  type: 'class' | 'pt-session';
  classId?: string;
  trainerId?: string;
  date: string;
  time?: string;
  focus?: string;
  preferences?: {
    preferredInstructor?: string;
    preferredTime?: string;
    level?: string;
  };
}

export interface CancellationRequest {
  bookingId: string;
  reason?: string;
  reschedule?: boolean;
}

export class BookingAI {
  private classes: Map<string, GymClass> = new Map();
  private trainers: Map<string, Trainer> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private ptSessions: Map<string, PTSession> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Sample trainers
    const sampleTrainers: Trainer[] = [
      {
        id: 't1',
        name: 'Vikram Singh',
        specialties: ['weightlifting', 'hiit'],
        rating: 4.8,
        experience: 8,
        certifications: ['ACE Certified', 'CrossFit L2'],
        available: true,
        classes: ['Power HIIT', 'Strength Training'],
        memberReviews: [
          { memberName: 'Rahul S', rating: 5, comment: 'Best trainer ever!' },
          { memberName: 'Priya M', rating: 5, comment: 'Incredible results' }
        ]
      },
      {
        id: 't2',
        name: 'Neha Kapoor',
        specialties: ['yoga', 'pilates', 'rehabilitation'],
        rating: 4.9,
        experience: 10,
        certifications: ['RYT 500', 'Pilates Instructor'],
        available: true,
        classes: ['Morning Yoga', 'Pilates Core'],
        memberReviews: [
          { memberName: 'Anita K', rating: 5, comment: 'So calming and knowledgeable' }
        ]
      },
      {
        id: 't3',
        name: 'Arjun Mehta',
        specialties: ['cardio', 'spinning'],
        rating: 4.7,
        experience: 5,
        certifications: ['Spinning Certified'],
        available: true,
        classes: ['Spinning', 'Cardio Blast'],
        memberReviews: []
      },
      {
        id: 't4',
        name: 'Maria Garcia',
        specialties: ['dance', 'cardio'],
        rating: 4.6,
        experience: 6,
        certifications: ['Zumba Instructor', 'Dance Fitness'],
        available: true,
        classes: ['Zumba Party', 'Dance Cardio'],
        memberReviews: [
          { memberName: 'Sofia R', rating: 5, comment: 'So much fun!' }
        ]
      }
    ];
    sampleTrainers.forEach(t => this.trainers.set(t.id, t));

    // Sample classes
    const sampleClasses: GymClass[] = [
      {
        id: 'c1',
        name: 'Morning Yoga',
        type: 'yoga',
        instructor: 'Neha Kapoor',
        instructorId: 't2',
        schedule: '06:00',
        duration: 60,
        capacity: 20,
        enrolled: 15,
        waitlist: [],
        room: 'Studio A',
        level: 'beginner',
        equipment: ['Yoga Mat', 'Blocks'],
        description: 'Start your day with energizing sun salutations and stretching'
      },
      {
        id: 'c2',
        name: 'Power HIIT',
        type: 'hiit',
        instructor: 'Vikram Singh',
        instructorId: 't1',
        schedule: '07:00',
        duration: 45,
        capacity: 15,
        enrolled: 14,
        waitlist: [],
        room: 'Ground Floor',
        level: 'intermediate',
        equipment: ['Dumbbells', 'Kettlebells', 'Battle Ropes'],
        description: 'High-intensity intervals to burn fat and build endurance'
      },
      {
        id: 'c3',
        name: 'Spinning',
        type: 'spinning',
        instructor: 'Arjun Mehta',
        instructorId: 't3',
        schedule: '18:00',
        duration: 45,
        capacity: 12,
        enrolled: 10,
        waitlist: [],
        room: 'Cycling Studio',
        level: 'intermediate',
        equipment: ['Spin Bikes'],
        description: 'Indoor cycling for cardio and leg strength'
      },
      {
        id: 'c4',
        name: 'Zumba Party',
        type: 'zumba',
        instructor: 'Maria Garcia',
        instructorId: 't4',
        schedule: '19:00',
        duration: 60,
        capacity: 25,
        enrolled: 22,
        waitlist: [],
        room: 'Studio B',
        level: 'beginner',
        equipment: [],
        description: 'Dance your way to fitness with Latin-inspired moves'
      },
      {
        id: 'c5',
        name: 'Strength Training',
        type: 'strength',
        instructor: 'Vikram Singh',
        instructorId: 't1',
        schedule: '08:00',
        duration: 60,
        capacity: 10,
        enrolled: 8,
        waitlist: [],
        room: 'Weight Room',
        level: 'advanced',
        equipment: ['Barbells', 'Dumbbells', 'Power Rack'],
        description: 'Build muscle and strength with progressive overload'
      },
      {
        id: 'c6',
        name: 'Pilates Core',
        type: 'pilates',
        instructor: 'Neha Kapoor',
        instructorId: 't2',
        schedule: '17:00',
        duration: 45,
        capacity: 15,
        enrolled: 12,
        waitlist: [],
        room: 'Studio A',
        level: 'intermediate',
        equipment: ['Pilates Mat', 'Resistance Bands'],
        description: 'Core strengthening and flexibility work'
      }
    ];
    sampleClasses.forEach(c => this.classes.set(c.id, c));
  }

  /**
   * Search for available classes
   */
  async searchClasses(filters: {
    type?: ClassType;
    date?: string;
    time?: string;
    level?: string;
    instructor?: string;
    available?: boolean;
  }): Promise<GymClass[]> {
    let results = Array.from(this.classes.values());

    if (filters.type) {
      results = results.filter(c => c.type === filters.type);
    }
    if (filters.level) {
      results = results.filter(c => c.level === filters.level);
    }
    if (filters.instructor) {
      results = results.filter(c =>
        c.instructor.toLowerCase().includes(filters.instructor!.toLowerCase())
      );
    }
    if (filters.time) {
      results = results.filter(c => c.schedule.startsWith(filters.time!));
    }
    if (filters.available !== undefined) {
      results = results.filter(c =>
        filters.available ? c.enrolled < c.capacity : c.enrolled >= c.capacity
      );
    }

    return results.sort((a, b) => {
      const aAvailable = a.capacity - a.enrolled;
      const bAvailable = b.capacity - b.enrolled;
      return bAvailable - aAvailable;
    });
  }

  /**
   * Book a class
   */
  async bookClass(request: BookingRequest): Promise<{
    booking: Booking;
    classDetails: GymClass;
    position?: number;
    aiMessage: string;
  }> {
    if (!request.classId) {
      throw new Error('Class ID is required');
    }

    const gymClass = this.classes.get(request.classId);
    if (!gymClass) {
      throw new Error('Class not found');
    }

    const isFull = gymClass.enrolled >= gymClass.capacity;
    let status: BookingStatus = 'confirmed';
    let position: number | undefined;

    if (isFull) {
      // Add to waitlist
      gymClass.waitlist.push(request.memberId);
      status = 'waitlisted';
      position = gymClass.waitlist.length;
      this.classes.set(request.classId, gymClass);
    } else {
      // Confirm booking
      gymClass.enrolled++;
      this.classes.set(request.classId, gymClass);
    }

    const booking: Booking = {
      id: uuidv4(),
      memberId: request.memberId,
      memberName: request.memberName,
      type: 'class',
      classId: request.classId,
      className: gymClass.name,
      date: request.date,
      time: gymClass.schedule,
      status,
      bookedAt: new Date().toISOString()
    };

    this.bookings.set(booking.id, booking);

    let aiMessage: string;
    if (status === 'confirmed') {
      aiMessage = `${request.memberName}, you're booked for ${gymClass.name} at ${gymClass.schedule} with ${gymClass.instructor}! Room: ${gymClass.room}. See you there!`;
    } else {
      aiMessage = `${request.memberName}, ${gymClass.name} is full but you're #${position} on the waitlist. We'll notify you if a spot opens up!`;
    }

    return { booking, classDetails: gymClass, position, aiMessage };
  }

  /**
   * Book a PT session
   */
  async bookPTSession(request: BookingRequest): Promise<{
    booking: Booking;
    ptSession: PTSession;
    trainer: Trainer;
    aiMessage: string;
  }> {
    if (!request.trainerId) {
      throw new Error('Trainer ID is required');
    }

    const trainer = this.trainers.get(request.trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    if (!trainer.available) {
      throw new Error('Trainer is not available');
    }

    const ptSession: PTSession = {
      id: uuidv4(),
      memberId: request.memberId,
      memberName: request.memberName,
      trainerId: request.trainerId,
      trainerName: trainer.name,
      date: request.date,
      time: request.time || '10:00',
      duration: 60,
      focus: request.focus || 'General Fitness',
      status: 'scheduled'
    };

    this.ptSessions.set(ptSession.id, ptSession);

    const booking: Booking = {
      id: uuidv4(),
      memberId: request.memberId,
      memberName: request.memberName,
      type: 'pt-session',
      ptSessionId: ptSession.id,
      date: request.date,
      time: ptSession.time,
      status: 'confirmed',
      bookedAt: new Date().toISOString()
    };

    this.bookings.set(booking.id, booking);

    return {
      booking,
      ptSession,
      trainer,
      aiMessage: `${request.memberName}, your PT session with ${trainer.name} is confirmed for ${request.date} at ${ptSession.time}! Focus: ${ptSession.focus}. Prepare to work hard!`
    };
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(request: CancellationRequest): Promise<{
    success: boolean;
    booking: Booking;
    refundEligible: boolean;
    aiMessage: string;
  }> {
    const booking = this.bookings.get(request.bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const hoursUntilClass = this.getHoursUntil(booking.date, booking.time);
    const refundEligible = hoursUntilClass >= 4;

    booking.status = 'cancelled';
    booking.cancelledAt = new Date().toISOString();
    booking.cancellationReason = request.reason;

    // Update class enrollment if it was a class booking
    if (booking.type === 'class' && booking.classId) {
      const gymClass = this.classes.get(booking.classId);
      if (gymClass) {
        if (gymClass.waitlist.includes(booking.memberId)) {
          gymClass.waitlist = gymClass.waitlist.filter(id => id !== booking.memberId);
        } else {
          gymClass.enrolled = Math.max(0, gymClass.enrolled - 1);
          // Promote from waitlist
          if (gymClass.waitlist.length > 0) {
            const nextMember = gymClass.waitlist.shift()!;
            gymClass.enrolled++;
            // In real system, would notify next member
          }
        }
        this.classes.set(booking.classId, gymClass);
      }
    }

    // Cancel PT session if applicable
    if (booking.type === 'pt-session' && booking.ptSessionId) {
      const ptSession = this.ptSessions.get(booking.ptSessionId);
      if (ptSession) {
        ptSession.status = 'cancelled';
        this.ptSessions.set(booking.ptSessionId, ptSession);
      }
    }

    this.bookings.set(booking.id, booking);

    let aiMessage = `${booking.memberName}, your ${booking.type === 'class' ? 'class' : 'PT session'} has been cancelled.`;
    if (refundEligible) {
      aiMessage += ' A full refund has been initiated.';
    } else {
      aiMessage += ' Note: Cancellations within 4 hours may not be eligible for refund.';
    }

    return { success: true, booking, refundEligible, aiMessage };
  }

  /**
   * Get member's bookings
   */
  async getMemberBookings(memberId: string): Promise<{
    upcoming: Booking[];
    past: Booking[];
    waitlisted: Booking[];
  }> {
    const memberBookings = Array.from(this.bookings.values())
      .filter(b => b.memberId === memberId);

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return {
      upcoming: memberBookings
        .filter(b => b.status === 'confirmed' && (b.date > today || (b.date === today)))
        .sort((a, b) => a.date.localeCompare(b.date)),
      past: memberBookings
        .filter(b => b.status === 'completed' || b.date < today)
        .sort((a, b) => b.date.localeCompare(a.date)),
      waitlisted: memberBookings
        .filter(b => b.status === 'waitlisted')
        .sort((a, b) => a.date.localeCompare(b.date))
    };
  }

  /**
   * Get available trainers
   */
  async getTrainers(filters?: {
    specialty?: TrainerSpecialty;
    available?: boolean;
    minRating?: number;
  }): Promise<Trainer[]> {
    let results = Array.from(this.trainers.values());

    if (filters?.specialty) {
      results = results.filter(t => t.specialties.includes(filters.specialty!));
    }
    if (filters?.available !== undefined) {
      results = results.filter(t => t.available === filters.available);
    }
    if (filters?.minRating) {
      results = results.filter(t => t.rating >= filters.minRating!);
    }

    return results.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get trainer availability
   */
  async getTrainerAvailability(trainerId: string, date: string): Promise<{
    trainer: Trainer;
    slots: { time: string; available: boolean }[];
  }> {
    const trainer = this.trainers.get(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    const allSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

    // Find booked slots
    const bookedSessions = Array.from(this.ptSessions.values())
      .filter(s => s.trainerId === trainerId && s.date === date && s.status !== 'cancelled');

    const bookedTimes = new Set(bookedSessions.map(s => s.time));

    const slots = allSlots.map(time => ({
      time,
      available: !bookedTimes.has(time)
    }));

    return { trainer, slots };
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    bookingId: string,
    newDate: string,
    newTime?: string
  ): Promise<{
    booking: Booking;
    aiMessage: string;
  }> {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Cannot reschedule a cancelled booking');
    }

    booking.date = newDate;
    if (newTime) {
      booking.time = newTime;
    }

    this.bookings.set(bookingId, booking);

    // Update PT session if applicable
    if (booking.ptSessionId) {
      const ptSession = this.ptSessions.get(booking.ptSessionId);
      if (ptSession) {
        ptSession.date = newDate;
        if (newTime) ptSession.time = newTime;
        ptSession.status = 'rescheduled';
        this.ptSessions.set(booking.ptSessionId, ptSession);
      }
    }

    return {
      booking,
      aiMessage: `${booking.memberName}, your ${booking.type} has been rescheduled to ${newDate}${newTime ? ' at ' + newTime : ''}. See you then!`
    };
  }

  /**
   * Get class recommendations
   */
  async getRecommendations(memberId: string, memberPreferences?: string[]): Promise<{
    recommendedClasses: GymClass[];
    reasons: string[];
  }> {
    const allClasses = Array.from(this.classes.values());
    const memberBookings = Array.from(this.bookings.values())
      .filter(b => b.memberId === memberId && b.status !== 'cancelled');

    const bookedClassTypes = new Set(
      memberBookings
        .map(b => this.classes.get(b.classId!)?.type)
        .filter(Boolean)
    );

    // Score classes
    const scored = allClasses.map(gymClass => {
      let score = 50;

      // Prefer classes not yet booked
      const alreadyBooked = memberBookings.some(b =>
        b.classId === gymClass.id && b.date >= new Date().toISOString().split('T')[0]
      );
      if (!alreadyBooked) score += 20;

      // Prefer variety
      if (!bookedClassTypes.has(gymClass.type)) score += 15;

      // Prefer classes with availability
      if (gymClass.enrolled < gymClass.capacity) score += 10;

      // Match preferences
      if (memberPreferences?.includes(gymClass.type)) score += 10;

      return { gymClass, score };
    });

    const sorted = scored.sort((a, b) => b.score - a.score);

    return {
      recommendedClasses: sorted.slice(0, 4).map(s => s.gymClass),
      reasons: [
        'Classes that complement your current routine',
        'Based on your preferences',
        'Limited spots available - book soon!'
      ]
    };
  }

  private getHoursUntil(date: string, time: string): number {
    const classDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();
    return (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  }
}

export default BookingAI;
