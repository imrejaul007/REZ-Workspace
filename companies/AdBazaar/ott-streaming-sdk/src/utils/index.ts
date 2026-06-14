import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function generateEventId(): string {
  return `evt-${uuidv4()}`;
}

export function generateSessionId(): string {
  return `sess-${uuidv4()}`;
}

export function generateLicenseId(): string {
  return `lic-${uuidv4()}`;
}