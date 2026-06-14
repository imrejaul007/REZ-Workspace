import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Injectable } from '@nestjs/common';
import xss from 'xss';
import sanitizeHtml from 'sanitize-html';

@ValidatorConstraint({ name: 'isSecureString', async: false })
@Injectable()
export class IsSecureStringConstraint implements ValidatorConstraintInterface {
  validate(text: string): boolean {
    if (typeof text !== 'string') return false;

    // Check for common XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<link/gi,
      /<meta/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
    ];

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /((\-\-)|(\')|(;))/g,
      /(\b(or|and)\b\s*\w*\s*=\s*\w*)/gi,
    ];

    // Check for path traversal
    const pathTraversalPatterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%252e%252e%252f/gi,
    ];

    // Check for command injection
    const commandInjectionPatterns = [
      /[;&|`$(){}[\]\\]/g,
    ];

    const allPatterns = [...xssPatterns, ...sqlPatterns, ...pathTraversalPatterns, ...commandInjectionPatterns];

    return !allPatterns.some(pattern => pattern.test(text));
  }

  defaultMessage(): string {
    return 'Text contains potentially unsafe content';
  }
}

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
@Injectable()
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    if (typeof password !== 'string') return false;

    // At least 8 characters
    if (password.length < 8) return false;

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) return false;

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) return false;

    // At least one number
    if (!/\d/.test(password)) return false;

    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

    // No common passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
  }
}

@ValidatorConstraint({ name: 'isSafeFilename', async: false })
@Injectable()
export class IsSafeFilenameConstraint implements ValidatorConstraintInterface {
  validate(filename: string): boolean {
    if (typeof filename !== 'string') return false;

    // Check for dangerous characters
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) return false;

    // Check for reserved names (Windows)
    const reservedNames = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ];

    const nameWithoutExt = filename.split('.')[0].toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) return false;

    // Check length
    if (filename.length > 255) return false;

    // Check for hidden files starting with dot (optional based on requirements)
    if (filename.startsWith('.')) return false;

    // Check for double extensions (common in malware)
    const extensions = filename.split('.').slice(1);
    const executableExts = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js'];
    const hasExecutableExt = extensions.some(ext => executableExts.includes(ext.toLowerCase()));

    if (hasExecutableExt && extensions.length > 1) return false;

    return true;
  }

  defaultMessage(): string {
    return 'Filename contains unsafe characters or patterns';
  }
}

// Decorator functions
export function IsSecureString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSecureStringConstraint,
    });
  };
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

export function IsSafeFilename(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeFilenameConstraint,
    });
  };
}

// Utility functions
export class SecurityUtils {
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return input;

    // XSS protection
    let sanitized = xss(input, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });

    // Additional sanitization
    sanitized = sanitizeHtml(sanitized, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'recursiveEscape'
    });

    return sanitized;
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}