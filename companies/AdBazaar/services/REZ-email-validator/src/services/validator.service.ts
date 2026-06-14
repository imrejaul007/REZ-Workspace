import { EmailValidationResult, BulkValidationResult, ValidationCache } from '../types';
import { syntaxService } from './syntax.service';
import { mxService } from './mx.service';
import { disposableService } from './disposable.service';
import { smtpService } from './smtp.service';
import { logger } from '../utils/logger';

interface ValidationOptions {
  checkMX: boolean;
  checkSMTP: boolean;
  checkDisposable: boolean;
}

export class ValidatorService {
  private cache: Map<string, ValidationCache>;
  private cacheTTL: number; // in minutes

  constructor(cacheTTL: number = 60) {
    this.cache = new Map();
    this.cacheTTL = cacheTTL;
  }

  async validate(
    email: string,
    options: Partial<ValidationOptions> = {}
  ): Promise<EmailValidationResult> {
    const startTime = Date.now();
    const normalizedEmail = syntaxService.normalize(email);

    // Check cache
    const cached = this.getFromCache(normalizedEmail);
    if (cached) {
      logger.info(`Cache hit for ${normalizedEmail}`);
      return cached.result;
    }

    // Run validations
    const syntax = syntaxService.validate(normalizedEmail);
    const riskFactors: string[] = [];
    let score = 0;

    // If syntax is invalid, return early
    if (!syntax.valid) {
      const result: EmailValidationResult = {
        email: normalizedEmail,
        valid: false,
        syntax,
        score: 0,
        isRisky: true,
        riskFactors: ['Invalid email syntax'],
      };
      return result;
    }

    score += 50; // Base score for valid syntax

    // MX validation
    let mx;
    if (options.checkMX !== false) {
      mx = await mxService.validateMX(syntax.domain);
      if (!mx.hasMX) {
        riskFactors.push('No MX records found');
      }
      score += mx.score;
    }

    // SMTP validation
    let smtp;
    if (options.checkSMTP) {
      smtp = await smtpService.validate(normalizedEmail);
      if (smtp.acceptsMail === false) {
        riskFactors.push('Mail server rejected recipient');
      }
      score += smtp.score;
    }

    // Disposable check
    let disposable;
    if (options.checkDisposable !== false) {
      disposable = disposableService.check(normalizedEmail);
      if (disposable.isDisposable) {
        riskFactors.push(`Disposable email provider: ${disposable.provider}`);
      }
      score += disposable.score;
    }

    // Determine if risky
    const isRisky = riskFactors.length > 0 || score < 50;
    const valid = syntax.valid && (mx?.hasMX !== false) && !disposable?.isDisposable;

    const result: EmailValidationResult = {
      email: normalizedEmail,
      valid,
      syntax,
      mx,
      smtp,
      disposable,
      score,
      isRisky,
      riskFactors,
    };

    // Cache result
    this.cacheResult(normalizedEmail, result);

    const duration = Date.now() - startTime;
    logger.logValidation(normalizedEmail, valid, score, duration);

    return result;
  }

  async validateBulk(
    emails: string[],
    options: Partial<ValidationOptions> = {}
  ): Promise<BulkValidationResult> {
    const results: EmailValidationResult[] = [];
    let valid = 0;
    let invalid = 0;
    let risky = 0;
    let syntaxFailures = 0;
    let mxFailures = 0;
    let smtpFailures = 0;
    let disposableCount = 0;

    for (const email of emails) {
      const result = await this.validate(email, options);
      results.push(result);

      if (result.valid) valid++;
      else invalid++;

      if (result.isRisky) risky++;
      if (!result.syntax.valid) syntaxFailures++;
      if (result.mx && !result.mx.hasMX) mxFailures++;
      if (result.smtp && result.smtp.acceptsMail === false) smtpFailures++;
      if (result.disposable?.isDisposable) disposableCount++;
    }

    return {
      total: emails.length,
      valid,
      invalid,
      risky,
      results,
      summary: {
        syntaxFailures,
        mxFailures,
        smtpFailures,
        disposableCount,
      },
    };
  }

  private getFromCache(email: string): ValidationCache | null {
    const cached = this.cache.get(email);
    if (!cached) return null;

    const now = Date.now();
    const age = (now - cached.timestamp.getTime()) / 1000 / 60; // in minutes

    if (age > this.cacheTTL) {
      this.cache.delete(email);
      return null;
    }

    return cached;
  }

  private cacheResult(email: string, result: EmailValidationResult): void {
    this.cache.set(email, {
      email,
      result,
      timestamp: new Date(),
      ttl: this.cacheTTL,
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const validatorService = new ValidatorService();
