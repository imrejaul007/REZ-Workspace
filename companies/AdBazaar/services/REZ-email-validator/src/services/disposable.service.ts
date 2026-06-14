import { DisposableCheck, DISPOSABLE_DOMAINS } from '../types';
import { logger } from '../utils/logger';

export class DisposableService {
  private disposableDomains: Set<string>;
  private customProviders: Set<string>;

  constructor() {
    this.disposableDomains = new Set(DISPOSABLE_DOMAINS.map(d => d.toLowerCase()));
    this.customProviders = new Set();
  }

  check(email: string): DisposableCheck {
    const domain = email.split('@')[1]?.toLowerCase();

    if (!domain) {
      return {
        isDisposable: false,
        provider: null,
        score: 50,
      };
    }

    const isDisposable = this.disposableDomains.has(domain);
    const provider = isDisposable ? domain : null;

    logger.logDisposableCheck(email, isDisposable, provider);

    return {
      isDisposable,
      provider,
      score: isDisposable ? 0 : 50,
    };
  }

  isDisposableDomain(domain: string): boolean {
    const normalizedDomain = domain.toLowerCase();
    return this.disposableDomains.has(normalizedDomain) ||
           this.customProviders.has(normalizedDomain);
  }

  addDisposableDomain(domain: string): void {
    this.disposableDomains.add(domain.toLowerCase());
  }

  removeDisposableDomain(domain: string): void {
    this.disposableDomains.delete(domain.toLowerCase());
  }

  getDisposableDomains(): string[] {
    return Array.from(this.disposableDomains);
  }

  getProviderInfo(domain: string): { isDisposable: boolean; risk: 'low' | 'medium' | 'high' } {
    const isDisposable = this.isDisposableDomain(domain);

    return {
      isDisposable,
      risk: isDisposable ? 'high' : 'low',
    };
  }
}

export const disposableService = new DisposableService();
