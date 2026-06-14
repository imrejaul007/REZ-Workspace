import { SyntaxValidation } from '../types';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export class SyntaxService {
  validate(email: string): SyntaxValidation {
    const trimmed = email.trim().toLowerCase();
    const isValid = EMAIL_REGEX.test(trimmed);

    if (!isValid) {
      return {
        valid: false,
        normalized: '',
        domain: '',
        localPart: '',
      };
    }

    const [localPart, domain] = trimmed.split('@');

    return {
      valid: true,
      normalized: trimmed,
      domain,
      localPart,
    };
  }

  normalize(email: string): string {
    const validated = this.validate(email);
    return validated.normalized || email.toLowerCase().trim();
  }

  extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1].toLowerCase() : '';
  }

  extractLocalPart(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 ? parts[0] : '';
  }
}

export const syntaxService = new SyntaxService();
