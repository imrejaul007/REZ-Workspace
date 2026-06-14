/**
 * Sequence Builder
 *
 * Multi-step automation engine for GTM campaigns
 * Handles: steps, conditions, delays, branching, A/B testing
 */

const { v4: uuidv4 } = require('uuid');

// In-memory sequence storage
const sequences = new Map();
const enrollments = new Map();

// Seed default sequences
const seedSequences = () => {
  // Enterprise Outreach Sequence
  sequences.set('seq_enterprise', {
    id: 'seq_enterprise',
    name: 'Enterprise Outreach',
    description: 'Full outreach sequence for enterprise targets',
    steps: [
      {
        id: 'step_1',
        order: 1,
        channel: 'email',
        delayDays: 0,
        subject: '{{company.name}} - Quick question about {{company.industry}}',
        template: 'intro_email',
        condition: null,
        variant: 'A'
      },
      {
        id: 'step_2',
        order: 2,
        channel: 'linkedin',
        delayDays: 2,
        subject: null,
        template: 'linkedin_intro',
        condition: { type: 'no_reply', previousStep: 'step_1' },
        variant: 'A'
      },
      {
        id: 'step_3',
        channel: 'email',
        delayDays: 5,
        subject: 'Following up on {{company.name}}',
        template: 'follow_up_1',
        condition: { type: 'no_reply', previousStep: 'step_2' },
        variant: 'A'
      },
      {
        id: 'step_4',
        channel: 'call',
        delayDays: 7,
        subject: null,
        template: 'cold_call',
        condition: { type: 'no_reply', previousStep: 'step_3' },
        variant: null
      },
      {
        id: 'step_5',
        channel: 'email',
        delayDays: 10,
        subject: 'Last try - {{company.name}}',
        template: 'last_chance',
        condition: { type: 'no_reply', previousStep: 'step_4' },
        variant: 'A'
      }
    ],
    settings: {
      stopOnReply: true,
      stopOnMeeting: true,
      stopOnOptOut: true,
      maxAttempts: 5,
      timezone: 'Asia/Kolkata',
      bestTimeToSend: '09:00'
    },
    stats: {
      enrolled: 156,
      completed: 45,
      replied: 34,
      meetings: 12,
      optOut: 3
    },
    createdAt: new Date().toISOString()
  });

  // D2C Brands Sequence
  sequences.set('seq_d2c', {
    id: 'seq_d2c',
    name: 'D2C Brands Sequence',
    description: 'For D2C e-commerce brands',
    steps: [
      {
        id: 'step_1',
        order: 1,
        channel: 'email',
        delayDays: 0,
        subject: 'Loyalty for D2C brands like {{company.name}}',
        template: 'd2c_intro',
        condition: null
      },
      {
        id: 'step_2',
        channel: 'whatsapp',
        delayDays: 1,
        subject: null,
        template: 'whatsapp_followup',
        condition: { type: 'no_reply', previousStep: 'step_1' }
      },
      {
        id: 'step_3',
        channel: 'email',
        delayDays: 4,
        subject: 'How {{company.name}} could double repeat purchases',
        template: 'd2c_case_study',
        condition: { type: 'no_reply', previousStep: 'step_2' }
      }
    ],
    settings: {
      stopOnReply: true,
      stopOnMeeting: true,
      stopOnOptOut: true,
      maxAttempts: 3
    },
    stats: {
      enrolled: 89,
      completed: 23,
      replied: 18,
      meetings: 5,
      optOut: 2
    },
    createdAt: new Date().toISOString()
  });

  // Follow-up Sequence
  sequences.set('seq_followup', {
    id: 'seq_followup',
    name: 'Follow-up Sequence',
    description: 'Nurture sequence for warm leads',
    steps: [
      { id: 'step_1', order: 1, channel: 'email', delayDays: 3, template: 'follow_1' },
      { id: 'step_2', order: 2, channel: 'email', delayDays: 7, template: 'follow_2' },
      { id: 'step_3', order: 3, channel: 'email', delayDays: 14, template: 'follow_3' }
    ],
    settings: {
      stopOnReply: true,
      stopOnMeeting: true
    },
    stats: { enrolled: 234, completed: 89, replied: 45, meetings: 15, optOut: 4 },
    createdAt: new Date().toISOString()
  });

  // Demo Request Sequence
  sequences.set('seq_demo', {
    id: 'seq_demo',
    name: 'Demo Request',
    description: 'Sequence after initial interest',
    steps: [
      { id: 'step_1', order: 1, channel: 'email', delayDays: 0, template: 'demo_request' },
      { id: 'step_2', order: 2, channel: 'email', delayDays: 2, template: 'demo_reminder' },
      { id: 'step_3', order: 3, channel: 'call', delayDays: 4, template: 'demo_call' }
    ],
    settings: {
      stopOnMeeting: true
    },
    stats: { enrolled: 67, completed: 34, replied: 28, meetings: 19, optOut: 1 },
    createdAt: new Date().toISOString()
  });
};

seedSequences();

/**
 * Create a new sequence
 */
function createSequence(data) {
  const sequence = {
    id: `seq_${uuidv4().slice(0, 8)}`,
    name: data.name || 'New Sequence',
    description: data.description || '',
    steps: (data.steps || []).map((s, i) => ({
      id: `step_${uuidv4().slice(0, 8)}`,
      order: i + 1,
      channel: s.channel || 'email',
      delayDays: s.delayDays || 0,
      subject: s.subject || null,
      template: s.template || 'default',
      condition: s.condition || null,
      variant: s.variant || null
    })),
    settings: data.settings || {
      stopOnReply: true,
      stopOnMeeting: true,
      stopOnOptOut: true,
      maxAttempts: 5
    },
    stats: {
      enrolled: 0,
      completed: 0,
      replied: 0,
      meetings: 0,
      optOut: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  sequences.set(sequence.id, sequence);
  return sequence;
}

/**
 * Update a sequence
 */
function updateSequence(id, updates) {
  const sequence = sequences.get(id);
  if (!sequence) return null;

  if (updates.name) sequence.name = updates.name;
  if (updates.description) sequence.description = updates.description;
  if (updates.steps) {
    sequence.steps = updates.steps.map((s, i) => ({
      ...s,
      id: s.id || `step_${uuidv4().slice(0, 8)}`,
      order: i + 1
    }));
  }
  if (updates.settings) {
    sequence.settings = { ...sequence.settings, ...updates.settings };
  }
  sequence.updatedAt = new Date().toISOString();

  return sequence;
}

/**
 * Add step to sequence
 */
function addStep(sequenceId, step) {
  const sequence = sequences.get(sequenceId);
  if (!sequence) return null;

  const newStep = {
    id: `step_${uuidv4().slice(0, 8)}`,
    order: sequence.steps.length + 1,
    channel: step.channel || 'email',
    delayDays: step.delayDays || 0,
    subject: step.subject || null,
    template: step.template || 'default',
    condition: step.condition || null,
    variant: step.variant || null
  };

  sequence.steps.push(newStep);
  sequence.updatedAt = new Date().toISOString();
  return newStep;
}

/**
 * Remove step from sequence
 */
function removeStep(sequenceId, stepId) {
  const sequence = sequences.get(sequenceId);
  if (!sequence) return null;

  sequence.steps = sequence.steps.filter(s => s.id !== stepId);
  // Re-order remaining steps
  sequence.steps.forEach((s, i) => s.order = i + 1);
  sequence.updatedAt = new Date().toISOString();

  return sequence;
}

/**
 * Reorder steps
 */
function reorderSteps(sequenceId, stepIds) {
  const sequence = sequences.get(sequenceId);
  if (!sequence) return null;

  const stepMap = new Map(sequence.steps.map(s => [s.id, s]));
  sequence.steps = stepIds
    .map((id, i) => {
      const step = stepMap.get(id);
      if (step) {
        step.order = i + 1;
        return step;
      }
      return null;
    })
    .filter(Boolean);

  sequence.updatedAt = new Date().toISOString();
  return sequence;
}

/**
 * Enroll contact in sequence
 */
function enrollContact(contactId, sequenceId, prospectData) {
  const sequence = sequences.get(sequenceId);
  if (!sequence) return null;

  const enrollment = {
    id: `enr_${uuidv4().slice(0, 8)}`,
    contactId,
    sequenceId,
    status: 'active',
    currentStep: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
    lastActivityAt: new Date().toISOString(),
    prospect: prospectData,
    stepHistory: [],
    replyReceived: false,
    meetingBooked: false,
    optedOut: false
  };

  enrollments.set(enrollment.id, enrollment);

  // Update sequence stats
  sequence.stats.enrolled++;

  return enrollment;
}

/**
 * Process enrollment - get next step
 */
function getNextStep(enrollmentId) {
  const enrollment = enrollments.get(enrollmentId);
  if (!enrollment) return null;

  const sequence = sequences.get(enrollment.sequenceId);
  if (!sequence) return null;

  // Check if should stop
  if (sequence.settings.stopOnReply && enrollment.replyReceived) {
    enrollment.status = 'stopped_reply';
    enrollment.completedAt = new Date().toISOString();
    return { done: true, reason: 'reply_received' };
  }

  if (sequence.settings.stopOnMeeting && enrollment.meetingBooked) {
    enrollment.status = 'stopped_meeting';
    enrollment.completedAt = new Date().toISOString();
    return { done: true, reason: 'meeting_booked' };
  }

  if (sequence.settings.stopOnOptOut && enrollment.optedOut) {
    enrollment.status = 'stopped_optout';
    enrollment.completedAt = new Date().toISOString();
    return { done: true, reason: 'opted_out' };
  }

  // Check if all steps completed
  if (enrollment.currentStep >= sequence.steps.length) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date().toISOString();
    sequence.stats.completed++;
    return { done: true, reason: 'sequence_complete' };
  }

  // Get current step
  const step = sequence.steps[enrollment.currentStep];

  // Check condition
  if (step.condition) {
    const prevStepCompleted = enrollment.stepHistory.find(
      h => h.stepId === step.condition.previousStep
    );

    if (step.condition.type === 'no_reply') {
      if (prevStepCompleted && prevStepCompleted.replied) {
        // Skip this step - they replied
        enrollment.currentStep++;
        return getNextStep(enrollmentId);
      }
    }
  }

  // Calculate when to send
  const lastActivity = new Date(enrollment.lastActivityAt);
  const sendAt = new Date(lastActivity);
  sendAt.setDate(sendAt.getDate() + step.delayDays);

  return {
    step,
    sendAt: sendAt.toISOString(),
    enrollment: {
      id: enrollment.id,
      contactId: enrollment.contactId,
      prospect: enrollment.prospect
    }
  };
}

/**
 * Mark step as sent
 */
function markStepSent(enrollmentId, stepId) {
  const enrollment = enrollments.get(enrollmentId);
  if (!enrollment) return null;

  enrollment.stepHistory.push({
    stepId,
    sentAt: new Date().toISOString(),
    replied: false
  });

  enrollment.currentStep++;
  enrollment.lastActivityAt = new Date().toISOString();

  return enrollment;
}

/**
 * Mark step as replied
 */
function markStepReplied(enrollmentId, stepId, replyData = {}) {
  const enrollment = enrollments.get(enrollmentId);
  if (!enrollment) return null;

  const stepHistory = enrollment.stepHistory.find(h => h.stepId === stepId);
  if (stepHistory) {
    stepHistory.replied = true;
    stepHistory.repliedAt = new Date().toISOString();
    stepHistory.replyData = replyData;
  }

  enrollment.replyReceived = true;
  enrollment.lastActivityAt = new Date().toISOString();

  const sequence = sequences.get(enrollment.sequenceId);
  if (sequence) {
    sequence.stats.replied++;
  }

  return enrollment;
}

/**
 * Mark meeting booked
 */
function markMeetingBooked(enrollmentId) {
  const enrollment = enrollments.get(enrollmentId);
  if (!enrollment) return null;

  enrollment.meetingBooked = true;
  enrollment.lastActivityAt = new Date().toISOString();

  const sequence = sequences.get(enrollment.sequenceId);
  if (sequence) {
    sequence.stats.meetings++;
  }

  return enrollment;
}

/**
 * Opt out contact
 */
function optOutContact(enrollmentId) {
  const enrollment = enrollments.get(enrollmentId);
  if (!enrollment) return null;

  enrollment.optedOut = true;
  enrollment.status = 'stopped_optout';
  enrollment.completedAt = new Date().toISOString();

  const sequence = sequences.get(enrollment.sequenceId);
  if (sequence) {
    sequence.stats.optOut++;
  }

  return enrollment;
}

/**
 * Get sequence stats
 */
function getSequenceStats(sequenceId) {
  const sequence = sequences.get(sequenceId);
  if (!sequence) return null;

  const sequenceEnrollments = Array.from(enrollments.values())
    .filter(e => e.sequenceId === sequenceId);

  const active = sequenceEnrollments.filter(e => e.status === 'active').length;
  const completed = sequenceEnrollments.filter(e => e.status === 'completed').length;
  const stopped = sequenceEnrollments.filter(e => e.status.startsWith('stopped')).length;

  const replied = sequenceEnrollments.filter(e => e.replyReceived).length;
  const meetings = sequenceEnrollments.filter(e => e.meetingBooked).length;

  return {
    ...sequence.stats,
    active,
    completed,
    stopped,
    total: sequenceEnrollments.length,
    replyRate: sequenceEnrollments.length ? (replied / sequenceEnrollments.length * 100).toFixed(1) + '%' : '0%',
    meetingRate: sequenceEnrollments.length ? (meetings / sequenceEnrollments.length * 100).toFixed(1) + '%' : '0%'
  };
}

/**
 * Get all sequences
 */
function getAllSequences() {
  return Array.from(sequences.values());
}

/**
 * Get sequence by ID
 */
function getSequence(id) {
  return sequences.get(id);
}

/**
 * Delete sequence
 */
function deleteSequence(id) {
  return sequences.delete(id);
}

/**
 * Get enrollments for a sequence
 */
function getSequenceEnrollments(sequenceId, filters = {}) {
  let enrollmentsList = Array.from(enrollments.values())
    .filter(e => e.sequenceId === sequenceId);

  if (filters.status) {
    enrollmentsList = enrollmentsList.filter(e => e.status === filters.status);
  }

  return enrollmentsList;
}

/**
 * A/B Test - assign variant
 */
function assignVariant(sequenceId) {
  const sequence = sequences.get(sequenceId);
  if (!sequence) return 'A';

  // Check if A/B testing is set up
  const variantSteps = sequence.steps.filter(s => s.variant);
  if (variantSteps.length === 0) return 'A';

  // Randomly assign variant
  return Math.random() > 0.5 ? 'A' : 'B';
}

module.exports = {
  // Sequence CRUD
  createSequence,
  updateSequence,
  addStep,
  removeStep,
  reorderSteps,
  getAllSequences,
  getSequence,
  deleteSequence,

  // Enrollment
  enrollContact,
  getNextStep,
  markStepSent,
  markStepReplied,
  markMeetingBooked,
  optOutContact,
  getSequenceEnrollments,

  // Stats
  getSequenceStats,
  assignVariant
};