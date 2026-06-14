import { randomBytes } from 'crypto';

/**
 * Generate a unique project ID in format PROJ-XXXXX
 */
export function generateProjectId(): string {
  const num = randomBytes(3).readUInt16BE(0) % 100000;
  return `PROJ-${num.toString().padStart(5, '0')}`;
}

/**
 * Generate a unique task ID in format TASK-XXXXX
 */
export function generateTaskId(): string {
  const num = randomBytes(3).readUInt16BE(0) % 100000;
  return `TASK-${num.toString().padStart(5, '0')}`;
}

/**
 * Generate a unique sprint ID in format SPRINT-XXXXX
 */
export function generateSprintId(): string {
  const num = randomBytes(3).readUInt16BE(0) % 100000;
  return `SPRINT-${num.toString().padStart(5, '0')}`;
}

/**
 * Generate a unique milestone ID in format MS-XXXXX
 */
export function generateMilestoneId(): string {
  const num = randomBytes(2).readUInt16BE(0) % 100000;
  return `MS-${num.toString().padStart(5, '0')}`;
}

/**
 * Generate a unique attachment ID
 */
export function generateAttachmentId(): string {
  return `ATT-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Generate a unique comment ID
 */
export function generateCommentId(): string {
  return `CMT-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Generate a unique subtask ID
 */
export function generateSubtaskId(): string {
  return `ST-${randomBytes(3).toString('hex').toUpperCase()}`;
}
